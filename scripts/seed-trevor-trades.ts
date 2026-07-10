import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const uid = "813859d1-474f-436d-8762-f04f252e60be"
  const symbols = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD", "XAU/USD", "GBP/JPY", "USD/CAD"]

  const trades = []
  let totalPnl = 0
  let wins = 0

  for (let i = 45; i >= 1; i--) {
    const day = Date.now() - i * 86400000
    const seed = Math.floor(day / 86400000)
    const r = (Math.sin(seed * 9301 + 49297) * 49297) - Math.floor(Math.sin(seed * 9301 + 49297) * 49297)
    const baseReturn = 0.5 + r * 2.5
    const isGreen = (Math.sin((seed + 100) * 9301 + 49297) * 49297) - Math.floor(Math.sin((seed + 100) * 9301 + 49297) * 49297) > 0.2
    const pnlPercent = isGreen ? baseReturn : -baseReturn * 0.6
    const balance = 4000 + totalPnl
    const pnlAmount = Number((balance * pnlPercent / 100).toFixed(2))
    totalPnl = Number((totalPnl + pnlAmount).toFixed(2))
    if (pnlAmount > 0) wins++

    const symbol = symbols[Math.floor(r * symbols.length)]
    const volume = Number((0.1 + r * 0.9).toFixed(2))
    const price = Number((100 + r * 100).toFixed(5))
    const closePrice = Number((price * (1 + pnlPercent / 100 / 10)).toFixed(5))

    trades.push({
      user_id: uid,
      symbol,
      type: pnlAmount >= 0 ? "buy" : "sell",
      volume,
      open_price: price,
      close_price: closePrice,
      profit: pnlAmount,
      status: "closed",
      created_at: new Date(day).toISOString(),
      closed_at: new Date(day + 3600000).toISOString(),
    })
  }

  const { error } = await s.from("trades").insert(trades)
  if (error) { console.error("Insert error:", error.message); return }

  const winRate = Number(((wins / 45) * 100).toFixed(1))
  const roi = Number(((totalPnl / 4000) * 100).toFixed(1))

  await s.from("master_traders").update({
    roi,
    win_rate: winRate,
    total_trades: 45,
    total_pnl: totalPnl,
    total_followers: 0,
  }).eq("user_id", uid)

  await s.from("accounts").update({ balance: 4000 + totalPnl, equity: 4000 + totalPnl }).eq("user_id", uid)
  await s.from("mt_accounts").update({ balance: 4000 + totalPnl, equity: 4000 + totalPnl }).eq("user_id", uid)

  console.log(`Seeded 45 trades. PnL: $${totalPnl}, Win rate: ${winRate}%, ROI: ${roi}%`)
  console.log(`Final balance: $${(4000 + totalPnl).toFixed(2)}`)
}

main()
