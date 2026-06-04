// Seed script: Add Master FX and Flossin as master traders
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
  {
    email: "masterfx@tradex.com",
    password: "MasterFX123!",
    displayName: "Master FX",
    firstName: "Master",
    lastName: "FX",
    bio: "Professional forex trader with 12+ years experience. Specializes in EUR/USD and GBP/USD pairs. Consistent returns with strict risk management.",
    roi: 47.8,
    winRate: 78.5,
    totalFollowers: 234,
    totalTrades: 1289,
    riskLevel: "medium",
    performanceFee: 25.0,
    minInvestment: 50.0,
  },
  {
    email: "flossin@tradex.com",
    password: "Flossin123!",
    displayName: "Flossin",
    firstName: "Flossin",
    lastName: "Trader",
    bio: "Crypto and indices specialist. 8 years trading BTC, ETH, and NASDAQ. High-conviction swing trader with low drawdown.",
    roi: 32.4,
    winRate: 82.1,
    totalFollowers: 156,
    totalTrades: 847,
    riskLevel: "low",
    performanceFee: 20.0,
    minInvestment: 25.0,
  },
]

async function seed() {
  console.log("🌱 Seeding master traders...\n")

  for (const t of traders) {
    console.log(`\n--- ${t.displayName} ---`)

    // Check if master trader already exists
    const { data: existing } = await supabase
      .from("master_traders")
      .select("id, display_name")
      .eq("display_name", t.displayName)
      .maybeSingle()

    if (existing) {
      console.log(`  ✓ ${t.displayName} already exists (id: ${existing.id})`)
      continue
    }

    // Check if auth user exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", t.email)
      .maybeSingle()

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log(`  ✓ User ${t.email} already exists (id: ${userId})`)
    } else {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: t.email,
        password: t.password,
        email_confirm: true,
        user_metadata: { first_name: t.firstName, last_name: t.lastName },
      })

      if (authError) {
        console.error(`  ✗ Failed to create auth user: ${authError.message}`)
        continue
      }

      userId = authUser.user.id
      console.log(`  ✓ Created auth user ${t.email} (id: ${userId})`)

      // Create profile (trigger might handle this, but ensure it exists)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        email: t.email,
        first_name: t.firstName,
        last_name: t.lastName,
      })

      if (profileError) {
        console.error(`  ✗ Failed to create profile: ${profileError.message}`)
        continue
      }
      console.log(`  ✓ Created profile`)
    }

    // Create master trader
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
        is_verified: true,
        is_active: true,
      })
      .select()
      .single()

    if (traderError) {
      console.error(`  ✗ Failed to create master trader: ${traderError.message}`)
      continue
    }

    console.log(`  ✓ Created master trader: ${trader.display_name} (id: ${trader.id})`)
  }

  console.log("\n✅ Done!")
  console.log("\nYou can now view the traders in the Copy Trading panel at:")
  console.log("  /dashboard/copy-trading")
}

seed().catch(console.error)
