import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const uid = "813859d1-474f-436d-8762-f04f252e60be"

  const { error: delErr } = await s.from("master_traders").delete().eq("user_id", uid)
  if (delErr) { console.error("Delete error:", delErr.message); return }
  console.log("Deleted from master_traders")

  const { error: roleErr } = await s.from("profiles").update({ role: "user" }).eq("id", uid)
  if (roleErr) { console.error("Role update error:", roleErr.message); return }
  console.log("Role set to user")
}

main()
