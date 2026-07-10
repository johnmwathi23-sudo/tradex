import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const SYMBOLS = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD", "XAU/USD", "GBP/JPY", "USD/CAD"]
const TREVOR_UID = "813859d1-474f-436d-8762-f04f252e60be"

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function dailyPnL(day: number): { pnlPercent: number; pnlAmount: number } {
  const r = seededRandom(day)
  const baseReturn = 0.5 + r * 2.5
  const isGreen = seededRandom(day + 100) > 0.2
  const pnlPercent = isGreen ? baseReturn : -baseReturn * 0.6
  return { pnlPercent, pnlAmount: 0 }
}

export async function POST(req: Request) {
  try {
    const isCron = req.headers.get("x-vercel-cron") === "1"
    const hasSecret = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
    if (!isCron && !hasSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const day = Math.floor(Date.now() / 86400000)
    const { pnlPercent } = dailyPnL(day)

    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("balance")
      .eq("user_id", TREVOR_UID)
      .single()

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })

    const currentBalance = Number(account.balance)
    const pnlAmount = Number((currentBalance * pnlPercent / 100).toFixed(2))
    const newBalance = Number((currentBalance + pnlAmount).toFixed(2))

    await supabaseAdmin.from("accounts").update({ balance: newBalance, equity: newBalance }).eq("user_id", TREVOR_UID)
    await supabaseAdmin.from("mt_accounts").update({ balance: newBalance, equity: newBalance }).eq("user_id", TREVOR_UID)

    const side = pnlAmount >= 0 ? "buy" : "sell"
    const symbol = SYMBOLS[Math.floor(seededRandom(day + 200) * SYMBOLS.length)]
    const volume = Number((0.1 + seededRandom(day + 300) * 0.9).toFixed(2))
    const price = Number((100 + seededRandom(day + 400) * 100).toFixed(5))
    const closePrice = Number((price * (1 + pnlPercent / 100 / 10)).toFixed(5))

    await supabaseAdmin.from("trades").insert({
      user_id: TREVOR_UID,
      symbol,
      type: side,
      volume,
      open_price: price,
      close_price: closePrice,
      profit: pnlAmount,
      status: "closed",
      created_at: new Date().toISOString(),
      closed_at: new Date().toISOString(),
    })

    const { data: trades } = await supabaseAdmin
      .from("trades")
      .select("profit")
      .eq("user_id", TREVOR_UID)
      .eq("status", "closed")

    const totalTrades = trades?.length ?? 0
    const totalPnl = trades?.reduce((s, t) => s + Number(t.profit ?? 0), 0) ?? 0
    const winningTrades = trades?.filter((t) => Number(t.profit ?? 0) > 0).length ?? 0
    const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0
    const roi = totalTrades > 0 ? Number(((totalPnl / newBalance) * 100).toFixed(1)) : 0

    const addedFollowers = seededRandom(day + 500) > 0.7 ? Math.floor(seededRandom(day + 600) * 3) + 1 : 0

    const { data: mt } = await supabaseAdmin
      .from("master_traders")
      .select("total_followers")
      .eq("user_id", TREVOR_UID)
      .single()

    const currentFollowers = mt?.total_followers ?? 0

    await supabaseAdmin
      .from("master_traders")
      .update({
        roi,
        win_rate: winRate,
        total_trades: totalTrades,
        total_pnl: Number(totalPnl.toFixed(2)),
        total_followers: currentFollowers + addedFollowers,
      })
      .eq("user_id", TREVOR_UID)

    return NextResponse.json({
      day,
      pnlPercent,
      pnlAmount,
      balance: newBalance,
      totalTrades,
      winRate,
      roi,
      addedFollowers,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
