import { config } from "dotenv"
config({ path: ".env" })

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
  { email: "masterfx@primestone.com", password: "MasterFX123!", displayName: "Master FX", firstName: "Master", lastName: "FX", bio: "Professional forex trader with 12+ years experience. Specializes in EUR/USD and GBP/USD pairs. Consistent returns with strict risk management.", roi: 47.8, winRate: 78.5, totalFollowers: 234, totalTrades: 1289, riskLevel: "medium", performanceFee: 25.0, minInvestment: 200.0, displayOrder: 1 },
  { email: "alphapro@primestone.com", password: "AlphaPro123!", displayName: "AlphaPro", firstName: "Alpha", lastName: "Pro", bio: "Aggressive forex and crypto trader. 10 years of market experience. Known for high-conviction trades on GBP/JPY and BTC with exceptional returns.", roi: 56.2, winRate: 71.3, totalFollowers: 189, totalTrades: 1567, riskLevel: "high", performanceFee: 30.0, minInvestment: 200.0, displayOrder: 2 },
  { email: "flossin@primestone.com", password: "Flossin123!", displayName: "Flossin", firstName: "Flossin", lastName: "Trader", bio: "Multi-market expert trading forex, crypto, and indices. Specializes in EUR/USD, GBP/USD, and NASDAQ. Consistent returns with low-risk approach.", roi: 32.4, winRate: 82.1, totalFollowers: 156, totalTrades: 847, riskLevel: "low", performanceFee: 20.0, minInvestment: 200.0, displayOrder: 3 },
  { email: "fxpulse@primestone.com", password: "Fxpulse123!", displayName: "FXPulse", firstName: "FX", lastName: "Pulse", bio: "Momentum trader focused on forex majors. 7 years experience reading market flow and capturing breakout moves on EUR/USD and USD/JPY.", roi: 28.9, winRate: 76.8, totalFollowers: 134, totalTrades: 1023, riskLevel: "medium", performanceFee: 22.0, minInvestment: 200.0, displayOrder: 4 },
  { email: "capitalvault@primestone.com", password: "CapitalVault123!", displayName: "CapitalVault", firstName: "Capital", lastName: "Vault", bio: "Conservative trader focused on capital preservation. Specializes in major forex pairs and gold. Steady growth with minimal drawdown.", roi: 22.4, winRate: 85.2, totalFollowers: 198, totalTrades: 634, riskLevel: "low", performanceFee: 18.0, minInvestment: 200.0, displayOrder: 5 },
  { email: "forexking@primestone.com", password: "ForexKing123!", displayName: "ForexKing", firstName: "Forex", lastName: "King", bio: "Forex specialist with expertise in exotic pairs. 15+ years trading USD/ZAR, USD/TRY, and EUR/TRY. High-reward opportunities identified through deep macro analysis.", roi: 41.5, winRate: 74.2, totalFollowers: 167, totalTrades: 2134, riskLevel: "high", performanceFee: 28.0, minInvestment: 200.0, displayOrder: 6 },
  { email: "cryptomaster@primestone.com", password: "CryptoMaster123!", displayName: "CryptoMaster", firstName: "Crypto", lastName: "Master", bio: "Full-time crypto trader since 2017. Trades BTC, ETH, and major altcoins. Combines technical analysis with on-chain metrics for entry and exit decisions.", roi: 68.3, winRate: 68.9, totalFollowers: 312, totalTrades: 876, riskLevel: "high", performanceFee: 35.0, minInvestment: 200.0, displayOrder: 7 },
  { email: "swiftrade@primestone.com", password: "SwifTrade123!", displayName: "SwifTrade", firstName: "Swif", lastName: "Trade", bio: "Day trader specializing in NASDAQ and S&P 500. Quick execution on breakouts with strict 1:3 risk-reward. 5+ years of index trading experience.", roi: 35.6, winRate: 72.1, totalFollowers: 145, totalTrades: 3456, riskLevel: "medium", performanceFee: 24.0, minInvestment: 200.0, displayOrder: 8 },
  { email: "goldenbull@primestone.com", password: "GoldenBull123!", displayName: "GoldenBull", firstName: "Golden", lastName: "Bull", bio: "Precious metals and commodities specialist. Trades gold, silver, and oil with a focus on supply-demand fundamentals and geopolitical analysis.", roi: 26.7, winRate: 79.8, totalFollowers: 178, totalTrades: 945, riskLevel: "low", performanceFee: 20.0, minInvestment: 200.0, displayOrder: 9 },
  { email: "pipsniper@primestone.com", password: "PipSniper123!", displayName: "PipSniper", firstName: "Pip", lastName: "Sniper", bio: "Intraday forex trader focusing on GBP pairs. Known for precise entries on the 15-minute chart with 80%+ win rate on EUR/GBP.", roi: 31.2, winRate: 83.4, totalFollowers: 123, totalTrades: 2890, riskLevel: "medium", performanceFee: 22.0, minInvestment: 200.0, displayOrder: 10 },
  { email: "fxelite@primestone.com", password: "FXElite123!", displayName: "FXElite", firstName: "FX", lastName: "Elite", bio: "Elite forex trader with institutional background. Algorithmic trading strategies on EUR/USD and USD/CHF. Consistent 5% monthly returns.", roi: 44.1, winRate: 76.5, totalFollowers: 256, totalTrades: 1567, riskLevel: "medium", performanceFee: 26.0, minInvestment: 200.0, displayOrder: 11 },
  { email: "tradeprophet@primestone.com", password: "TradeProphet123!", displayName: "TradeProphet", firstName: "Trade", lastName: "Prophet", bio: "Forex and indices trader using proprietary sentiment analysis. Predicts market turns with 70% accuracy. Specializes in EUR/USD and FTSE 100.", roi: 38.7, winRate: 70.2, totalFollowers: 89, totalTrades: 1245, riskLevel: "medium", performanceFee: 24.0, minInvestment: 200.0, displayOrder: 12 },
  { email: "marketwizard@primestone.com", password: "MarketWizard123!", displayName: "MarketWizard", firstName: "Market", lastName: "Wizard", bio: "Multi-asset trader with 20+ years experience. Trades forex, commodities, and indices using Wyckoff methodology and volume profile analysis.", roi: 29.8, winRate: 77.9, totalFollowers: 210, totalTrades: 3458, riskLevel: "low", performanceFee: 20.0, minInvestment: 200.0, displayOrder: 13 },
  { email: "quantumfx@primestone.com", password: "QuantumFx123!", displayName: "QuantumFx", firstName: "Quantum", lastName: "Fx", bio: "Quantitative forex trader using machine learning models. Automated trading systems on EUR and JPY pairs. Data-driven approach with backtested strategies.", roi: 52.4, winRate: 73.6, totalFollowers: 167, totalTrades: 4567, riskLevel: "medium", performanceFee: 30.0, minInvestment: 200.0, displayOrder: 14 },
  { email: "scalperpro@primestone.com", password: "ScalperPro123!", displayName: "ScalperPro", firstName: "Scalper", lastName: "Pro", bio: "Professional scalper trading EUR/USD and USD/JPY. 100+ trades daily with 1-3 pip targets. 90%+ win rate through strict discipline and rapid execution.", roi: 18.5, winRate: 91.2, totalFollowers: 198, totalTrades: 12345, riskLevel: "low", performanceFee: 18.0, minInvestment: 200.0, displayOrder: 15 },
  { email: "forexsignal@primestone.com", password: "ForexSignal123!", displayName: "ForexSignal", firstName: "Forex", lastName: "Signal", bio: "Signal provider with 8 years of forex trading. Daily trade setups on EUR/USD, GBP/USD, and USD/JPY with detailed analysis and risk management guidelines.", roi: 25.3, winRate: 75.4, totalFollowers: 445, totalTrades: 2345, riskLevel: "medium", performanceFee: 22.0, minInvestment: 200.0, displayOrder: 16 },
  { email: "bullmarket@primestone.com", password: "BullMarket123!", displayName: "BullMarket", firstName: "Bull", lastName: "Market", bio: "Long-term trend follower trading forex and indices. Catches major market moves using swing trading strategies. Patient approach with 10+ years experience.", roi: 33.9, winRate: 71.8, totalFollowers: 134, totalTrades: 567, riskLevel: "low", performanceFee: 20.0, minInvestment: 200.0, displayOrder: 17 },
  { email: "fxanalyst@primestone.com", password: "FXAnalyst123!", displayName: "FXAnalyst", firstName: "FX", lastName: "Analyst", bio: "Fundamental forex trader with economics background. Trades based on central bank policy, economic indicators, and geopolitical events. Specializes in G10 currencies.", roi: 27.4, winRate: 73.2, totalFollowers: 156, totalTrades: 1890, riskLevel: "medium", performanceFee: 22.0, minInvestment: 200.0, displayOrder: 18 },
  { email: "tradestorm@primestone.com", password: "TradeStorm123!", displayName: "TradeStorm", firstName: "Trade", lastName: "Storm", bio: "Volatility trader thriving in turbulent markets. Specializes in VIX-related products and safe-haven currency pairs during market stress events.", roi: 45.2, winRate: 65.8, totalFollowers: 178, totalTrades: 1234, riskLevel: "high", performanceFee: 28.0, minInvestment: 200.0, displayOrder: 19 },
  { email: "cryptofx@primestone.com", password: "CryptoFX123!", displayName: "CryptoFX", firstName: "Crypto", lastName: "FX", bio: "Hybrid trader covering both crypto and forex markets. Uses intermarket analysis to find high-probability setups across both asset classes.", roi: 39.6, winRate: 70.5, totalFollowers: 234, totalTrades: 2789, riskLevel: "high", performanceFee: 26.0, minInvestment: 200.0, displayOrder: 20 },
  { email: "carlos.rivera@primestone.com", password: "Trader123!", displayName: "Carlos Rivera", firstName: "Carlos", lastName: "Rivera", bio: "Senior forex trader from Madrid with 14 years in the markets. Specializes in EUR/USD and USD/MXN. Combines technical analysis with macro-economic trends for high-probability setups.", roi: 36.2, winRate: 76.8, totalFollowers: 187, totalTrades: 2341, riskLevel: "medium", performanceFee: 22.0, minInvestment: 200.0, displayOrder: 21 },
  { email: "chen.wei@primestone.com", password: "Trader123!", displayName: "Chen Wei", firstName: "Chen", lastName: "Wei", bio: "Shanghai-based quantitative trader with a PhD in Financial Mathematics. Algorithmic trading specialist focusing on USD/CNH and Asian equity indices.", roi: 42.8, winRate: 74.2, totalFollowers: 245, totalTrades: 5678, riskLevel: "medium", performanceFee: 25.0, minInvestment: 200.0, displayOrder: 22 },
  { email: "adebayo.ogunlesi@primestone.com", password: "Trader123!", displayName: "Adebayo Ogunlesi", firstName: "Adebayo", lastName: "Ogunlesi", bio: "Lagos-based forex and commodities trader. Expert in USD/ZAR, USD/NGN, and oil trading. Deep understanding of African market dynamics and emerging market currencies.", roi: 31.5, winRate: 79.1, totalFollowers: 156, totalTrades: 1890, riskLevel: "low", performanceFee: 20.0, minInvestment: 100.0, displayOrder: 23 },
  { email: "priya.sharma@primestone.com", password: "Trader123!", displayName: "Priya Sharma", firstName: "Priya", lastName: "Sharma", bio: "Mumbai-based currency trader with expertise in USD/INR and Asian forex pairs. 9 years experience in both spot and derivatives markets.", roi: 28.4, winRate: 81.5, totalFollowers: 312, totalTrades: 2123, riskLevel: "low", performanceFee: 18.0, minInvestment: 100.0, displayOrder: 24 },
  { email: "giovanni.rossi@primestone.com", password: "Trader123!", displayName: "Giovanni Rossi", firstName: "Giovanni", lastName: "Rossi", bio: "Milan-based forex trader specializing in EUR crosses. 16 years of market experience with a particular focus on EUR/GBP and EUR/CHF. Conservative risk management.", roi: 24.7, winRate: 83.6, totalFollowers: 178, totalTrades: 1567, riskLevel: "low", performanceFee: 18.0, minInvestment: 100.0, displayOrder: 25 },
  { email: "yuki.tanaka@primestone.com", password: "Trader123!", displayName: "Yuki Tanaka", firstName: "Yuki", lastName: "Tanaka", bio: "Tokyo-based forex trader with 11 years experience. Specialist in USD/JPY and JPY crosses. Uses Ichimoku Kinko Hyo and Price Action for trade decisions.", roi: 33.1, winRate: 77.4, totalFollowers: 267, totalTrades: 3124, riskLevel: "medium", performanceFee: 22.0, minInvestment: 150.0, displayOrder: 26 },
  { email: "ahmed.alrashid@primestone.com", password: "Trader123!", displayName: "Ahmed Al-Rashid", firstName: "Ahmed", lastName: "Al-Rashid", bio: "Dubai-based multi-market trader covering forex, gold, and cryptocurrencies. 8 years experience with a focus on USD/SAR, XAU/USD, and BTC.", roi: 44.9, winRate: 72.3, totalFollowers: 198, totalTrades: 2789, riskLevel: "high", performanceFee: 28.0, minInvestment: 250.0, displayOrder: 27 },
  { email: "pierre.dubois@primestone.com", password: "Trader123!", displayName: "Pierre Dubois", firstName: "Pierre", lastName: "Dubois", bio: "Paris-based forex and commodity trader. 13 years experience specializing in EUR/USD and gold. Known for exceptional risk management and consistent returns.", roi: 29.6, winRate: 80.2, totalFollowers: 145, totalTrades: 1890, riskLevel: "low", performanceFee: 20.0, minInvestment: 150.0, displayOrder: 28 },
  { email: "olga.petrova@primestone.com", password: "Trader123!", displayName: "Olga Petrova", firstName: "Olga", lastName: "Petrova", bio: "Moscow-based forex trader focusing on EUR/USD and Brent crude oil. 10 years of market experience with a systematic approach to trading.", roi: 35.8, winRate: 75.6, totalFollowers: 167, totalTrades: 2345, riskLevel: "medium", performanceFee: 24.0, minInvestment: 200.0, displayOrder: 29 },
  { email: "kwame.asante@primestone.com", password: "Trader123!", displayName: "Kwame Asante", firstName: "Kwame", lastName: "Asante", bio: "Accra-based forex trader specializing in USD/GHS and West African markets. 6 years experience with a growing track record in emerging market currencies.", roi: 39.2, winRate: 73.8, totalFollowers: 89, totalTrades: 1567, riskLevel: "high", performanceFee: 26.0, minInvestment: 100.0, displayOrder: 30 },
]

async function seedTraders() {
  console.log("Seeding master traders...\n")

  for (const t of traders) {
    console.log(`--- ${t.displayName} ---`)

    const { data: existing } = await supabase
      .from("master_traders")
      .select("id")
      .eq("display_name", t.displayName)
      .maybeSingle()

    if (existing) {
      console.log(`  Already exists (id: ${existing.id})`)
      continue
    }

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: t.email,
      password: t.password,
      email_confirm: true,
      user_metadata: {
        first_name: t.firstName,
        last_name: t.lastName,
      },
    })

    if (createError) {
      console.log(`  Error creating user: ${createError.message}`)
      continue
    }

    console.log(`  Created auth user ${t.email} (id: ${newUser.user.id})`)

    const { error: profileError } = await supabase.from("profiles").insert({
      id: newUser.user.id,
      email: t.email,
      first_name: t.firstName,
      last_name: t.lastName,
      role: "trader",
      created_at: new Date().toISOString(),
    })

    if (profileError) {
      console.log(`  Error creating profile: ${profileError.message}`)
      continue
    }

    console.log(`  Created profile`)

    const { error: traderError } = await supabase.from("master_traders").insert({
      user_id: newUser.user.id,
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

    if (traderError) {
      console.log(`  Error creating master trader: ${traderError.message}`)
      continue
    }

    console.log(`  Created master trader: ${t.displayName} (id: ${newUser.user.id})`)
  }

  const { data: flossin } = await supabase
    .from("master_traders")
    .select("user_id")
    .eq("display_name", "Flossin")
    .single()

  if (flossin) {
    const { error: adminError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", flossin.user_id)
    if (adminError) {
      console.log(`\n  Error setting Flossin as admin: ${adminError.message}`)
    } else {
      console.log(`\n  Flossin set as admin`)
    }
  }

  console.log("\nDone!\nView traders at: /dashboard/copy-trading")
}

seedTraders()
