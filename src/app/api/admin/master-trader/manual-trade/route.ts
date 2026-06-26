import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getRealTimePrice } from "@/lib/prices"
import { copyTradeToFollowers } from "@/lib/auto-trader"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { symbol, type, volume, stop_loss, take_profit } = await req.json()
  if (!symbol || !type || !volume) {
    return NextResponse.json({ error: "Missing required fields: symbol, type, volume" }, { status: 400 })
  }

  if (type !== "buy" && type !== "sell") {
    return NextResponse.json({ error: "Type must be 'buy' or 'sell'" }, { status: 400 })
  }

  const { data: master } = await supabaseAdmin
    .from("master_traders")
    .select("id, user_id, total_trades")
    .eq("user_id", user.id)
    .single()

  if (!master) return NextResponse.json({ error: "Not a master trader" }, { status: 400 })

  const { data: mtAccount } = await supabaseAdmin
    .from("mt_accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "connected")
    .order("is_default", { ascending: false })
    .limit(1)
    .single()

  if (!mtAccount) return NextResponse.json({ error: "No connected MT account" }, { status: 400 })

  const price = await getRealTimePrice(symbol)
  if (!price) return NextResponse.json({ error: `Cannot get price for ${symbol}` }, { status: 503 })

  const entryPrice = type === "buy" ? price.ask : price.bid

  const { data: trade, error: tradeErr } = await supabaseAdmin
    .from("trades")
    .insert({
      user_id: master.user_id,
      account_id: mtAccount.id,
      symbol,
      type,
      volume: parseFloat(volume),
      open_price: entryPrice,
      stop_loss: stop_loss || null,
      take_profit: take_profit || null,
      status: "open",
      is_ai_generated: false,
    })
    .select()
    .single()

  if (tradeErr || !trade) {
    return NextResponse.json({ error: tradeErr?.message || "Failed to create trade" }, { status: 500 })
  }

  await supabaseAdmin
    .from("master_traders")
    .update({ total_trades: (master.total_trades || 0) + 1 })
    .eq("id", master.id)

  const copiedTo = await copyTradeToFollowers(trade.id, master.id)

  return NextResponse.json({
    success: true,
    trade,
    entry_price: entryPrice,
    copied_to_followers: copiedTo,
    message: `Manual trade: ${type.toUpperCase()} ${symbol} ${volume} lots @ ${entryPrice}` + (copiedTo > 0 ? ` (Copied to ${copiedTo} followers)` : ""),
  }, { status: 201 })
}
