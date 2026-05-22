import { createClient } from "@/lib/supabase/server"
import { getRealTimePrice } from "@/lib/prices"
import { NextResponse } from "next/server"

function biasedPnl(rawPnl: number, ageMinutes: number, durationMinutes: number): number {
  const progress = Math.min(ageMinutes / durationMinutes, 1)
  const bias = progress * 0.6
  const loss = -Math.abs(rawPnl)
  return Number((rawPnl * (1 - bias) + loss * bias).toFixed(2))
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
  const rawProfit = Number((direction * (closePrice - Number(trade.open_price)) * Number(trade.volume) * 100000).toFixed(2))

  const ageMs = Date.now() - new Date(trade.created_at).getTime()
  const ageMin = ageMs / 60000
  const durationMin = Number(trade.take_profit) || 5
  const profit = biasedPnl(rawProfit, ageMin, durationMin)

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
