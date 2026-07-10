import { createClient } from "@supabase/supabase-js"

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const email = "trevordyan4@gmail.com"
  const amount = 4000

  const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) { console.error("List users error:", listErr.message); return }

  const user = users.users.find((u: any) => u.email === email)
  if (!user) { console.error("User not found:", email); return }
  console.log("User ID:", user.id)

  const { error: accErr } = await supabase
    .from("accounts")
    .update({ balance: amount, equity: amount })
    .eq("user_id", user.id)

  if (accErr) {
    console.error("Accounts update error:", accErr.message)
    return
  }

  const { error: mtErr } = await supabase
    .from("mt_accounts")
    .update({ balance: amount, equity: amount })
    .eq("user_id", user.id)

  if (mtErr) {
    console.error("MT accounts update error:", mtErr.message)
    return
  }

  console.log(`Funded ${email} with $${amount} in accounts + mt_accounts`)
}

main()
