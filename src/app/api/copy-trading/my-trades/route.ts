import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getRealTimePrice, contractSize } from "@/lib/prices"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's active subscriptions to know which masters they follow
  const { data: subscriptions } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .select("master_trader_id, master_trader:master_traders!inner(id, user_id, display_name)")
    .eq("follower_id", user.id)
    .in("status", ["active", "paused"])

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ trades: [], summary: { totalPnl: 0, openCount: 0, closedCount: 0, winCount: 0, lossCount: 0 } })
  }

  // Fetch all trades that were copied to this user (have master_trade_id)
  const { data: trades, error } = await supabaseAdmin
    .from("trades")
    .select("*, account:mt_accounts(balance)")
    .eq("user_id", user.id)
    .not("master_trade_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!trades || trades.length === 0) {
    return NextResponse.json({ trades: [], summary: { totalPnl: 0, openCount: 0, closedCount: 0, winCount: 0, lossCount: 0 } })
  }

  // Build a lookup from user_id -> master display name
  const masterMap = new Map<string, string>()
  for (const sub of subscriptions) {
    const mt = sub.master_trader as any
    if (mt?.user_id && mt?.display_name) {
      masterMap.set(mt.user_id, mt.display_name)
    }
  }

  // Enrich trades with real-time prices for open trades
  const enrichedTrades = await Promise.all(
    trades.map(async (t: any) => {
      const masterName = masterMap.get(t.user_id) || "Unknown"
      const size = contractSize(t.symbol)

      if (t.status === "open") {
        try {
          const price = await getRealTimePrice(t.symbol)
          if (price) {
            const direction = t.type === "buy" ? 1 : -1
            const rawPnl = Number(
              (direction * (price.mid - Number(t.open_price)) * Number(t.volume) * size).toFixed(2)
            )
            return {
              ...t,
              current_price: price.mid,
              unrealized_pnl: rawPnl,
              master_name: masterName,
              contract_size: size,
            }
          }
        } catch {
          // Price fetch failed, use fallback
        }
        return {
          ...t,
          current_price: t.open_price,
          unrealized_pnl: 0,
          master_name: masterName,
          contract_size: size,
        }
      }

      // Closed trade - use stored profit
      return {
        ...t,
        current_price: t.close_price || t.open_price,
        unrealized_pnl: t.profit || 0,
        master_name: masterName,
        contract_size: size,
      }
    })
  )

  // Calculate summary stats
  let totalPnl = 0
  let openCount = 0
  let closedCount = 0
  let winCount = 0
  let lossCount = 0

  for (const t of enrichedTrades) {
    const pnl = t.status === "open" ? (t.unrealized_pnl ?? 0) : (t.profit ?? 0)
    totalPnl += pnl
    if (t.status === "open") {
      openCount++
    } else {
      closedCount++
      if (pnl > 0) winCount++
      else if (pnl < 0) lossCount++
    }
  }

  return NextResponse.json({
    trades: enrichedTrades,
    summary: {
      totalPnl: Number(totalPnl.toFixed(2)),
      openCount,
      closedCount,
      winCount,
      lossCount,
      winRate: closedCount > 0 ? Number(((winCount / closedCount) * 100).toFixed(1)) : 0,
    },
  })
}
