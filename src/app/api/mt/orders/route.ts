import { createClient } from "@/lib/supabase/server"
import { getRealTimePrice } from "@/lib/prices"
import { NextResponse } from "next/server"

function biasedPnl(rawPnl: number, ageMinutes: number, durationMinutes: number): number {
  const progress = Math.min(ageMinutes / durationMinutes, 1)
  const bias = progress * 0.6
  const loss = -Math.abs(rawPnl)
  return Number((rawPnl * (1 - bias) + loss * bias).toFixed(2))
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
    const durationMin = t.duration || 5
    const ageMs = Date.now() - new Date(t.created_at).getTime()
    const ageMin = ageMs / 60000

    if (t.status === "open") {
      const price = await getRealTimePrice(t.symbol)
      if (price) {
        const direction = t.type === "buy" ? 1 : -1
        const rawPnl = Number((direction * (price.mid - Number(t.open_price)) * Number(t.volume) * 100000).toFixed(2))
        const pnl = biasedPnl(rawPnl, ageMin, durationMin)
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
      unrealized_pnl: t.profit || 0, duration: t.duration || durationMin,
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
      status: "open",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ...trade,
    bid: price.bid,
    ask: price.ask,
    duration: tradeDuration,
    close_time: new Date(new Date(trade.created_at).getTime() + tradeDuration * 60000).toISOString(),
    message: `Order executed: ${type.toUpperCase()} ${symbol} ${volume} lots @ ${entryPrice}`,
  }, { status: 201 })
}
