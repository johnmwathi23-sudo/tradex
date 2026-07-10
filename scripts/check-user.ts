import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const email = "flossin@primestonemarkets.com"
  const { data: users } = await s.auth.admin.listUsers()
  const user = users?.users?.find((u: any) => u.email === email)
  if (!user) { console.log("User not found:", email); return }

  console.log("User ID:", user.id)
  console.log("Email confirmed:", user.email_confirmed_at)

  const { data: profile } = await s.from("profiles").select("*").eq("id", user.id).maybeSingle()
  console.log("Profile:", JSON.stringify(profile, null, 2))

  const { data: subs } = await s.from("copy_trade_subscriptions").select("*, master_trader:master_traders(*)").eq("follower_id", user.id)
  console.log("Subscriptions:", JSON.stringify(subs, null, 2))

  const { data: mt } = await s.from("mt_accounts").select("*").eq("user_id", user.id)
  console.log("MT Accounts:", JSON.stringify(mt, null, 2))

  const { data: acc } = await s.from("accounts").select("*").eq("user_id", user.id)
  console.log("Accounts:", JSON.stringify(acc, null, 2))
}

main()
