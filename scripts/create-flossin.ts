import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const email = "flossin@primestonemarkets.com"
  const password = "awesome123"

  // Check if exists via listUsers
  const { data: list } = await s.auth.admin.listUsers()
  const existing = list?.users?.find((u: any) => u.email === email)

  if (existing) {
    console.log("User already exists:", existing.id, "updating password...")
    await s.auth.admin.updateUserById(existing.id, { password })
    console.log("Password updated")
    return
  }

  // Create user
  const { data, error } = await s.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) { console.error("Create error:", error.message); return }
  console.log("Created auth user:", data.user.id)

  const uid = data.user.id

  // Create profile
  const { error: pErr } = await s.from("profiles").upsert({
    id: uid,
    email,
    role: "admin",
    first_name: "Flossin",
    last_name: "Admin",
    created_at: new Date().toISOString(),
  })
  if (pErr) { console.error("Profile error:", pErr.message); return }
  console.log("Profile created with role admin")

  // Create accounts
  const { data: existingAccounts } = await s.from("accounts").select("id").eq("user_id", uid).maybeSingle()
  if (!existingAccounts) {
    const { error: aErr } = await s.from("accounts").insert({
      user_id: uid,
      balance: 50000,
      equity: 50000,
      currency: "USD",
      leverage: "1:100",
      created_at: new Date().toISOString(),
    })
    if (aErr) { console.error("Account error:", aErr.message); return }
    console.log("Account created")
  } else {
    console.log("Account already exists")
  }

  const { data: existingMt } = await s.from("mt_accounts").select("id").eq("user_id", uid).maybeSingle()
  if (!existingMt) {
    const { error: mErr } = await s.from("mt_accounts").insert({
      user_id: uid,
      balance: 50000,
      equity: 50000,
      platform: "mt5",
      server: "PrimeStoneMarkets-Server",
    })
    if (mErr) { console.error("MT account error:", mErr.message); return }
    console.log("MT account created")
  } else {
    console.log("MT account already exists")
  }
  if (mErr) { console.error("MT account error:", mErr.message); return }
  console.log("MT account created")

  console.log("Done - login with", email, "/", password)
}

main()
