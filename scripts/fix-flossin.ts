import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) { console.log("List error:", listError.message); return }

  const flossin = users.users.find((u: any) => u.email === "flossin@primestone.com")
  if (!flossin) {
    console.log("flossin user not found in auth, creating...")
    const { data, error } = await supabase.auth.admin.createUser({
      email: "flossin@primestone.com",
      password: "Flossin123!",
      email_confirm: true,
      user_metadata: { first_name: "Flossin", last_name: "Trader" },
    })
    if (error) { console.log("Create error:", error.message); return }
    console.log("Created flossin auth user:", data.user.id)
  } else {
    console.log("flossin auth user found, resetting password...")
    const { error } = await supabase.auth.admin.updateUserById(flossin.id, {
      password: "Flossin123!",
    })
    if (error) { console.log("Update error:", error.message); return }
    console.log("Password reset to Flossin123!")
  }
}
main().catch(console.error)
