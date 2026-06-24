const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = "https://yuarpxzctinouecuqfai.supabase.co"
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YXJweHpjdGlub3VlY3VxZmFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI2NDY4MSwiZXhwIjoyMDk3ODQwNjgxfQ.8qxI4ib_aH_ozpiB0e7N-GpvLlKg4cOIvQFUnfNYj1A"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const USERS = [
  {
    email: "masterfx@primestone.com",
    password: "MasterFX123!",
    firstName: "Master",
    lastName: "FX",
    displayName: "Master FX",
    bio: "Professional forex trader with 12+ years experience. Specializes in EUR/USD and GBP/USD pairs.",
    roi: 47.8,
    winRate: 78.5,
    totalFollowers: 234,
    totalTrades: 1289,
    riskLevel: "medium",
    performanceFee: 25.0,
    minInvestment: 50.0,
  },
  {
    email: "flossin@primestone.com",
    password: "Flossin123!",
    firstName: "Flossin",
    lastName: "Trader",
    displayName: "Flossin",
    bio: "Crypto and indices specialist. 8 years trading BTC, ETH, and NASDAQ.",
    roi: 32.4,
    winRate: 82.1,
    totalFollowers: 156,
    totalTrades: 847,
    riskLevel: "low",
    performanceFee: 20.0,
    minInvestment: 25.0,
  },
]

async function run() {
  for (const u of USERS) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", u.email)
      .maybeSingle()

    if (existing) {
      console.log(`${u.email} already exists (id: ${existing.id})`)
      continue
    }

    // Create auth user via admin API
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (authErr) {
      console.error(`Error creating ${u.email}: ${authErr.message}`)
      continue
    }

    console.log(`Created auth user: ${u.email} (id: ${authUser.user.id})`)

    // Profile is auto-created by the handle_new_account trigger from migration_phase6
    // But let's ensure it exists by upserting
    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        id: authUser.user.id,
        email: u.email,
        first_name: u.firstName,
        last_name: u.lastName,
      },
      { onConflict: "id" }
    )

    if (profileErr) {
      console.error(`  Profile error: ${profileErr.message}`)
    } else {
      console.log(`  Profile created`)
    }

    // Create master trader record
    const { error: mtErr } = await supabase.from("master_traders").upsert(
      {
        user_id: authUser.user.id,
        display_name: u.displayName,
        bio: u.bio,
        roi: u.roi,
        win_rate: u.winRate,
        total_followers: u.totalFollowers,
        total_trades: u.totalTrades,
        risk_level: u.riskLevel,
        performance_fee: u.performanceFee,
        min_investment: u.minInvestment,
        is_verified: true,
        is_active: true,
      },
      { onConflict: "user_id" }
    )

    if (mtErr) {
      console.error(`  Master trader error: ${mtErr.message}`)
    } else {
      console.log(`  Master trader record created`)
    }
  }

  // Verify
  const { data: traders } = await supabase
    .from("master_traders")
    .select("display_name, roi, win_rate, total_followers, is_verified")
    .order("created_at")

  console.log("\n=== Master Traders ===")
  console.log(JSON.stringify(traders, null, 2))

  console.log("\nSeed complete!")
}

run().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
