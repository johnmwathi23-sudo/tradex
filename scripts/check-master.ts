import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const uid = "813859d1-474f-436d-8762-f04f252e60be"

  const { data: mt } = await s.from("master_traders").select("*").eq("user_id", uid).maybeSingle()
  console.log("master_trader:", JSON.stringify(mt, null, 2))

  const { count: tradeCount } = await s.from("trades").select("*", { count: "exact", head: true }).eq("user_id", uid)
  console.log("trade count:", tradeCount)

  if (mt) {
    const { count: subCount } = await s.from("copy_trade_subscriptions").select("*", { count: "exact", head: true }).eq("master_trader_id", mt.id)
    console.log("follower count:", subCount)
  }
}

main()
