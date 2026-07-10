import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const uid = "5f18f8d2-3844-4cc3-bf56-aec1483095bd"

  // Create profile
  const { error: pErr } = await s.from("profiles").upsert({
    id: uid,
    email: "flossin@primestonemarkets.com",
    role: "admin",
    first_name: "Flossin",
    last_name: "Admin",
    created_at: new Date().toISOString(),
  })
  if (pErr) { console.error("Profile error:", pErr.message); return }
  console.log("Profile upserted with role admin")

  // Create accounts if not exist
  const { data: existingAccounts } = await s.from("accounts").select("id").eq("user_id", uid).maybeSingle()
  if (!existingAccounts) {
    const { error: aErr } = await s.from("accounts").insert({
      user_id: uid, balance: 50000, equity: 50000, currency: "USD", leverage: "1:100", created_at: new Date().toISOString(),
    })
    if (aErr) { console.error("Account error:", aErr.message); return }
    console.log("Account created")
  } else { console.log("Account already exists") }

  const { data: existingMt } = await s.from("mt_accounts").select("id").eq("user_id", uid).maybeSingle()
  if (!existingMt) {
    const { error: mErr } = await s.from("mt_accounts").insert({
      user_id: uid, balance: 50000, equity: 50000, platform: "mt5", server: "PrimeStoneMarkets-Server",
    })
    if (mErr) { console.error("MT account error:", mErr.message); return }
    console.log("MT account created")
  } else { console.log("MT account already exists") }

  console.log("Done - login: flossin@primestonemarkets.com / awesome123")
}

main()
