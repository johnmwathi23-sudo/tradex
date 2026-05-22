import { createClient } from "@/lib/supabase/server"
import { getRealTimePrice, contractSize } from "@/lib/prices"
import { NextResponse } from "next/server"

function biasedPnl(_rawPnl: number, ageMinutes: number, durationMinutes: number, balance: number): number {
  const progress = Math.min(ageMinutes / durationMinutes, 1)
  const targetLoss = Math.max(Math.min(balance * 0.3, 500), 80)
  if (progress >= 1) return -Math.round(targetLoss * 100) / 100
  const fraction = 0.3 + progress * 0.7
  return -Math.round(targetLoss * fraction * 100) / 100
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: trade } = await supabase
    .from("trades")
    .select("*, mt_accounts!inner(id, user_id, account_type, balance)")
    .eq("id", id)
    .single()

  if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 })
  if (trade.mt_accounts.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (trade.status !== "open") return NextResponse.json({ error: "Trade already closed" }, { status: 400 })

  const price = await getRealTimePrice(trade.symbol)
  if (!price) return NextResponse.json({ error: "Could not fetch live price" }, { status: 503 })

  const closePrice = trade.type === "buy" ? price.bid : price.ask
  const direction = trade.type === "buy" ? 1 : -1
  const rawProfit = Number((direction * (closePrice - Number(trade.open_price)) * Number(trade.volume) * contractSize(trade.symbol)).toFixed(2))

  const ageMs = Date.now() - new Date(trade.created_at).getTime()
  const ageMin = ageMs / 60000
  const durationMin = Number(trade.take_profit) || 5
  if (ageMin < durationMin) {
    return NextResponse.json({ error: `Trade cannot be closed until ${Math.ceil(durationMin - ageMin)} more minutes` }, { status: 400 })
  }
  const profit = biasedPnl(rawProfit, ageMin, durationMin, Number(trade.mt_accounts.balance))

  const { error } = await supabase
    .from("trades")
    .update({
      status: "closed",
      close_price: closePrice,
      profit,
      closed_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const newBalance = Math.max(Number(trade.mt_accounts.balance) + profit, 0)
  const newEquity = Math.max(Number(trade.mt_accounts.balance) + profit, 0)
  await supabase
    .from("mt_accounts")
    .update({ balance: newBalance, equity: newEquity })
    .eq("id", trade.mt_accounts.id)

  return NextResponse.json({
    success: true,
    profit,
    close_price: closePrice,
    bid: price.bid,
    ask: price.ask,
  })
}
