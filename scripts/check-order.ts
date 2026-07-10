import { createClient } from "@supabase/supabase-js"

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await supabase
    .from("master_traders")
    .select("display_name, display_order")
    .order("display_order", { ascending: true })
    .order("total_followers", { ascending: false })

  if (data) {
    data.forEach((d: any, i: number) => console.log(i + 1, d.display_name, `(order: ${d.display_order})`))
  }
}

main()
