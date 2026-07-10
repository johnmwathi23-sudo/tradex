import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const uid = "813859d1-474f-436d-8762-f04f252e60be"

  const { data: profile } = await s.from("profiles").select("*").eq("id", uid).single()
  if (!profile) { console.error("Profile not found"); return }

  // Update profile role to trader
  await s.from("profiles").update({ role: "trader" }).eq("id", uid)

  // Get next display_order
  const { data: last } = await s.from("master_traders").select("display_order").order("display_order", { ascending: false }).limit(1)
  const nextOrder = (last?.[0]?.display_order ?? 30) + 1

  const { data: mt, error } = await s.from("master_traders").insert({
    user_id: uid,
    display_name: "Trevor Dyan",
    bio: "Professional multi-market trader specializing in forex and crypto. Consistent daily returns with strict risk management.",
    roi: 12.5,
    win_rate: 76,
    total_followers: 0,
    total_trades: 45,
    risk_level: "medium",
    performance_fee: 20,
    min_investment: 200,
    display_order: nextOrder,
    total_pnl: 480,
    is_verified: true,
    is_active: true,
  }).select().single()

  if (error) { console.error("Insert error:", error.message); return }
  console.log("Added master trader:", mt.id)
}

main()
