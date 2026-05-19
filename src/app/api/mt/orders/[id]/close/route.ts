import { createClient } from "@/lib/supabase/server"
import { getRealTimePrice } from "@/lib/prices"
import { NextResponse } from "next/server"

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
  const profit = Number((direction * (closePrice - Number(trade.open_price)) * Number(trade.volume) * 100000).toFixed(2))

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

  if (trade.mt_accounts.account_type === "demo") {
    const newBalance = Number(trade.mt_accounts.balance) + profit
    await supabase
      .from("mt_accounts")
      .update({ balance: newBalance, equity: newBalance })
      .eq("id", trade.mt_accounts.id)
  }

  return NextResponse.json({
    success: true,
    profit,
    close_price: closePrice,
    bid: price.bid,
    ask: price.ask,
  })
}
