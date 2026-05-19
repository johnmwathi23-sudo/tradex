import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function simulateCurrentPrice(trade: any): { current_price: number; unrealized_pnl: number } {
  const seed = trade.id.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
  const drift = ((seed % 200) - 100) / 10000
  const currentPrice = Number(trade.open_price) + drift
  const pipValue = trade.symbol?.includes("JPY") ? 0.01 : 0.0001
  const pipDiff = Math.abs(currentPrice - Number(trade.open_price)) / pipValue
  const direction = trade.type === "buy" ? 1 : -1
  const unrealizedPnl = Number((direction * (currentPrice - Number(trade.open_price)) * Number(trade.volume) * 100000).toFixed(2))
  return { current_price: Number(currentPrice.toFixed(5)), unrealized_pnl: unrealizedPnl }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("trades")
    .select("*, mt_accounts!inner(login_id, platform, server)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const enriched = (data ?? []).map((t: any) => {
    if (t.status === "open") {
      const sim = simulateCurrentPrice(t)
      return { ...t, current_price: sim.current_price, unrealized_pnl: sim.unrealized_pnl }
    }
    return { ...t, current_price: t.close_price || t.open_price, unrealized_pnl: t.profit || 0 }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { mt_account_id, symbol, type, volume, stop_loss, take_profit } = await req.json()

  if (!mt_account_id || !symbol || !type || !volume) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data: account } = await supabase
    .from("mt_accounts")
    .select("id, user_id, login_id, platform")
    .eq("id", mt_account_id)
    .single()

  if (!account) return NextResponse.json({ error: "MT account not found" }, { status: 404 })
  if (account.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const price = type === "buy" ? 1.1050 + Math.random() * 0.002 : 1.1050 - Math.random() * 0.002

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      account_id: mt_account_id,
      symbol,
      type,
      volume: parseFloat(volume),
      open_price: parseFloat(price.toFixed(5)),
      stop_loss: stop_loss || null,
      take_profit: take_profit || null,
      status: "open",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(trade, { status: 201 })
}
