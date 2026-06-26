// Seed script: Add 20 master traders including Flossin (ranked #3)
// Usage: npx tsx scripts/seed-traders.ts

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const traders = [
  { email: "masterfx@primestone.com", password: "MasterFX123!", displayName: "Master FX", firstName: "Master", lastName: "FX", bio: "Professional forex trader with 12+ years experience. Specializes in EUR/USD and GBP/USD pairs. Consistent returns with strict risk management.", roi: 47.8, winRate: 78.5, totalFollowers: 234, totalTrades: 1289, riskLevel: "medium", performanceFee: 25.0, minInvestment: 50.0, displayOrder: 1 },
  { email: "alphapro@primestone.com", password: "AlphaPro123!", displayName: "AlphaPro", firstName: "Alpha", lastName: "Pro", bio: "Aggressive forex and crypto trader. 10 years of market experience. Known for high-conviction trades on GBP/JPY and BTC with exceptional returns.", roi: 56.2, winRate: 71.3, totalFollowers: 189, totalTrades: 1567, riskLevel: "high", performanceFee: 30.0, minInvestment: 100.0, displayOrder: 2 },
  { email: "flossin@primestone.com", password: "Flossin123!", displayName: "Flossin", firstName: "Flossin", lastName: "Trader", bio: "Multi-market expert trading forex, crypto, and indices. Specializes in EUR/USD, GBP/USD, and NASDAQ. Consistent returns with low-risk approach.", roi: 32.4, winRate: 82.1, totalFollowers: 156, totalTrades: 847, riskLevel: "low", performanceFee: 20.0, minInvestment: 25.0, displayOrder: 3 },
  { email: "fxpulse@primestone.com", password: "Fxpulse123!", displayName: "FXPulse", firstName: "FX", lastName: "Pulse", bio: "Momentum trader focused on forex majors. 7 years experience reading market flow and capturing breakout moves on EUR/USD and USD/JPY.", roi: 28.9, winRate: 76.8, totalFollowers: 134, totalTrades: 1023, riskLevel: "medium", performanceFee: 22.0, minInvestment: 30.0, displayOrder: 4 },
  { email: "capitalvault@primestone.com", password: "CapitalVault123!", displayName: "CapitalVault", firstName: "Capital", lastName: "Vault", bio: "Capital preservation specialist. 15 years trading with a focus on steady growth. Trades indices and major forex pairs with tight risk controls.", roi: 18.5, winRate: 85.3, totalFollowers: 198, totalTrades: 2341, riskLevel: "low", performanceFee: 15.0, minInvestment: 200.0, displayOrder: 5 },
  { email: "forexking@primestone.com", password: "ForexKing123!", displayName: "ForexKing", firstName: "Forex", lastName: "King", bio: "High-stakes forex trader specializing in exotic pairs. 9 years of experience. Known for bold strategies on USD/TRY and USD/ZAR with massive returns.", roi: 44.1, winRate: 65.2, totalFollowers: 112, totalTrades: 892, riskLevel: "high", performanceFee: 35.0, minInvestment: 150.0, displayOrder: 6 },
  { email: "cryptomaster@primestone.com", password: "CryptoMaster123!", displayName: "CryptoMaster", firstName: "Crypto", lastName: "Master", bio: "Crypto market specialist. 6 years trading Bitcoin, Ethereum, and altcoins. Combines technical analysis with on-chain data for high-probability entries.", roi: 52.3, winRate: 72.1, totalFollowers: 267, totalTrades: 1560, riskLevel: "medium", performanceFee: 25.0, minInvestment: 50.0, displayOrder: 7 },
  { email: "swiftrade@primestone.com", password: "SwifTrade123!", displayName: "SwifTrade", firstName: "Swift", lastName: "Trade", bio: "Algorithmic trader leveraging quantitative models. 8 years building automated strategies for forex and indices. Low drawdown with consistent monthly returns.", roi: 22.7, winRate: 80.4, totalFollowers: 145, totalTrades: 678, riskLevel: "low", performanceFee: 18.0, minInvestment: 75.0, displayOrder: 8 },
  { email: "goldenbull@primestone.com", password: "GoldenBull123!", displayName: "GoldenBull", firstName: "Golden", lastName: "Bull", bio: "Precious metals and commodities expert. 11 years trading gold, silver, and oil. Specializes in XAU/USD with a deep understanding of macro drivers.", roi: 35.6, winRate: 74.9, totalFollowers: 178, totalTrades: 1134, riskLevel: "medium", performanceFee: 22.0, minInvestment: 100.0, displayOrder: 9 },
  { email: "pipsniper@primestone.com", password: "PipSniper123!", displayName: "PipSniper", firstName: "Pip", lastName: "Sniper", bio: "Day trader specializing in short-term forex scalping. 5 years of intensive screen time. Executes 50+ trades daily on EUR/USD and GBP/USD.", roi: 41.2, winRate: 68.7, totalFollowers: 98, totalTrades: 3456, riskLevel: "high", performanceFee: 30.0, minInvestment: 25.0, displayOrder: 10 },
  { email: "fxelite@primestone.com", password: "FxElite123!", displayName: "FXElite", firstName: "FX", lastName: "Elite", bio: "Institutional forex trader with 14 years experience. Former bank trader. Focuses on major pairs with institutional-grade risk management.", roi: 26.3, winRate: 83.6, totalFollowers: 212, totalTrades: 1890, riskLevel: "low", performanceFee: 20.0, minInvestment: 150.0, displayOrder: 11 },
  { email: "tradeprophet@primestone.com", password: "TradeProphet123!", displayName: "TradeProphet", firstName: "Trade", lastName: "Prophet", bio: "Forex and indices analyst with 13 years of market experience. Uses proprietary technical analysis framework. Known for accurate EUR/USD and S&P 500 calls.", roi: 38.9, winRate: 75.2, totalFollowers: 167, totalTrades: 1456, riskLevel: "medium", performanceFee: 25.0, minInvestment: 80.0, displayOrder: 12 },
  { email: "marketwizard@primestone.com", password: "MarketWizard123!", displayName: "MarketWizard", firstName: "Market", lastName: "Wizard", bio: "Multi-asset portfolio manager. 16 years trading forex, commodities, and indices. Conservative approach with emphasis on capital preservation and steady growth.", roi: 20.1, winRate: 86.7, totalFollowers: 223, totalTrades: 2100, riskLevel: "low", performanceFee: 15.0, minInvestment: 250.0, displayOrder: 13 },
  { email: "quantumfx@primestone.com", password: "QuantumFx123!", displayName: "QuantumFx", firstName: "Quantum", lastName: "Fx", bio: "Quantitative trader using AI-driven models. 7 years developing machine learning strategies for forex markets. High-reward approach on EUR/USD and USD/JPY.", roi: 48.7, winRate: 66.4, totalFollowers: 89, totalTrades: 723, riskLevel: "high", performanceFee: 35.0, minInvestment: 200.0, displayOrder: 14 },
  { email: "scalperpro@primestone.com", password: "ScalperPro123!", displayName: "ScalperPro", firstName: "Scalper", lastName: "Pro", bio: "Professional scalper with 6 years experience. Executes high-volume, low-risk trades on major forex pairs. Average hold time under 5 minutes.", roi: 31.5, winRate: 79.8, totalFollowers: 123, totalTrades: 4567, riskLevel: "medium", performanceFee: 20.0, minInvestment: 30.0, displayOrder: 15 },
  { email: "forexsignal@primestone.com", password: "ForexSignal123!", displayName: "ForexSignal", firstName: "Forex", lastName: "Signal", bio: "Technical analysis specialist. 10 years providing forex signals and market commentary. Focuses on price action and support/resistance levels on all major pairs.", roi: 24.8, winRate: 81.3, totalFollowers: 178, totalTrades: 1897, riskLevel: "low", performanceFee: 18.0, minInvestment: 50.0, displayOrder: 16 },
  { email: "bullmarket@primestone.com", password: "BullMarket123!", displayName: "BullMarket", firstName: "Bull", lastName: "Market", bio: "Trend follower specializing in bullish market conditions. 8 years trading indices and forex. Strong track record on NASDAQ, S&P 500, and USD/JPY during uptrends.", roi: 33.2, winRate: 73.5, totalFollowers: 145, totalTrades: 1098, riskLevel: "medium", performanceFee: 22.0, minInvestment: 75.0, displayOrder: 17 },
  { email: "fxanalyst@primestone.com", password: "FxAnalyst123!", displayName: "FXAnalyst", firstName: "FX", lastName: "Analyst", bio: "Fundamental forex analyst. 12 years studying macroeconomics and central bank policies. Trades based on interest rate differentials and economic indicators.", roi: 19.6, winRate: 84.2, totalFollowers: 156, totalTrades: 1345, riskLevel: "low", performanceFee: 15.0, minInvestment: 100.0, displayOrder: 18 },
  { email: "tradestorm@primestone.com", password: "TradeStorm123!", displayName: "TradeStorm", firstName: "Trade", lastName: "Storm", bio: "Volatility trader thriving in turbulent markets. 7 years experience. Specializes in trading during high-impact news events on forex and commodities.", roi: 45.3, winRate: 63.8, totalFollowers: 76, totalTrades: 634, riskLevel: "high", performanceFee: 30.0, minInvestment: 50.0, displayOrder: 19 },
  { email: "cryptofx@primestone.com", password: "CryptoFx123!", displayName: "CryptoFX", firstName: "Crypto", lastName: "Fx", bio: "Hybrid trader bridging forex and crypto markets. 5 years experience. Trades BTC/USD, ETH/USD alongside major forex pairs for diversified exposure.", roi: 36.7, winRate: 70.8, totalFollowers: 134, totalTrades: 923, riskLevel: "medium", performanceFee: 25.0, minInvestment: 60.0, displayOrder: 20 },
]

async function seed() {
  console.log("Seeding master traders...\n")

  for (const t of traders) {
    console.log(`\n--- ${t.displayName} ---`)

    const { data: existing } = await supabase
      .from("master_traders")
      .select("id, display_name")
      .eq("display_name", t.displayName)
      .maybeSingle()

    if (existing) {
      console.log(`  Already exists (id: ${existing.id})`)
      continue
    }

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", t.email)
      .maybeSingle()

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log(`  User ${t.email} already exists (id: ${userId})`)
    } else {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: t.email,
        password: t.password,
        email_confirm: true,
        user_metadata: { first_name: t.firstName, last_name: t.lastName },
      })

      if (authError) {
        console.error(`  Failed to create auth user: ${authError.message}`)
        continue
      }

      userId = authUser.user.id
      console.log(`  Created auth user ${t.email} (id: ${userId})`)

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        email: t.email,
        first_name: t.firstName,
        last_name: t.lastName,
      })

      if (profileError) {
        console.error(`  Failed to create profile: ${profileError.message}`)
        continue
      }
      console.log(`  Created profile`)
    }

    const { data: trader, error: traderError } = await supabase
      .from("master_traders")
      .insert({
        user_id: userId,
        display_name: t.displayName,
        bio: t.bio,
        roi: t.roi,
        win_rate: t.winRate,
        total_followers: t.totalFollowers,
        total_trades: t.totalTrades,
        risk_level: t.riskLevel,
        performance_fee: t.performanceFee,
        min_investment: t.minInvestment,
        display_order: t.displayOrder,
        is_verified: true,
        is_active: true,
      })
      .select()
      .single()

    if (traderError) {
      console.error(`  Failed to create master trader: ${traderError.message}`)
      continue
    }

    console.log(`  Created master trader: ${trader.display_name} (id: ${trader.id})`)
  }

  // Set Flossin as admin
  const { error: adminError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("email", "flossin@primestone.com")

  if (adminError) {
    console.error(`  Failed to set Flossin as admin: ${adminError.message}`)
  } else {
    console.log("\n  Flossin set as admin")
  }

  console.log("\nDone!")
  console.log("View traders at: /dashboard/copy-trading")
}

seed().catch(console.error)
