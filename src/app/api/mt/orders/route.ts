import { createClient } from "@/lib/supabase/server"
import { getRealTimePrice } from "@/lib/prices"
import { NextResponse } from "next/server"

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

  const enriched = await Promise.all((data ?? []).map(async (t: any) => {
    if (t.status === "open") {
      const price = await getRealTimePrice(t.symbol)
      if (price) {
        const direction = t.type === "buy" ? 1 : -1
        const pnl = Number((direction * (price.mid - Number(t.open_price)) * Number(t.volume) * 100000).toFixed(2))
        return { ...t, current_price: price.mid, mark_price: price.mid, unrealized_pnl: pnl, bid: price.bid, ask: price.ask }
      }
      return { ...t, current_price: t.open_price, mark_price: t.open_price, unrealized_pnl: 0 }
    }
    return { ...t, current_price: t.close_price || t.open_price, mark_price: t.close_price || t.open_price, unrealized_pnl: t.profit || 0 }
  }))

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
    .select("id, user_id")
    .eq("id", mt_account_id)
    .single()

  if (!account) return NextResponse.json({ error: "MT account not found" }, { status: 404 })
  if (account.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const price = await getRealTimePrice(symbol)
  if (!price) return NextResponse.json({ error: "Could not fetch live price" }, { status: 503 })

  const entryPrice = type === "buy" ? price.ask : price.bid

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      account_id: mt_account_id,
      symbol,
      type,
      volume: parseFloat(volume),
      open_price: entryPrice,
      stop_loss: stop_loss || null,
      take_profit: take_profit || null,
      status: "open",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ...trade,
    bid: price.bid,
    ask: price.ask,
    message: `Order executed: ${type.toUpperCase()} ${symbol} ${volume} lots @ ${entryPrice}`,
  }, { status: 201 })
}
