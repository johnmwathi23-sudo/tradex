import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data, error } = await supabase
    .from("master_traders")
    .select("display_name, display_order")
    .in("display_name", ["FXPulse", "Flossin"])
    .order("display_order", { ascending: true })

  if (error) { console.error(error); return }
  console.log("Before:", JSON.stringify(data, null, 2))

  const { error: e1 } = await supabase
    .from("master_traders")
    .update({ display_order: 3 })
    .eq("display_name", "FXPulse")

  const { error: e2 } = await supabase
    .from("master_traders")
    .update({ display_order: 4 })
    .eq("display_name", "Flossin")

  if (e1 || e2) { console.error(e1 ?? e2); return }

  const { data: after } = await supabase
    .from("master_traders")
    .select("display_name, display_order")
    .in("display_name", ["FXPulse", "Flossin"])
    .order("display_order", { ascending: true })

  console.log("After:", JSON.stringify(after, null, 2))
}

main()
