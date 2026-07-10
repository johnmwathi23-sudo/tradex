import { createClient } from "@supabase/supabase-js"

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: subsCols } = await supabase.rpc("get_table_columns", { table_name: "copy_trade_subscriptions" })
  console.log("copy_trade_subscriptions columns:", JSON.stringify(subsCols, null, 2))

  const { data: mtCols } = await supabase.rpc("get_table_columns", { table_name: "master_traders" })
  console.log("master_traders columns:", JSON.stringify(mtCols, null, 2))
}

main()
