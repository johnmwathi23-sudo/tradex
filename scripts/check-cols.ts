import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check accounts columns
  const { data: cols } = await s.rpc("get_columns", { table_name: "accounts" })
  console.log("Account columns:", JSON.stringify(cols))

  const { data: mtCols } = await s.rpc("get_columns", { table_name: "mt_accounts" })
  console.log("MT columns:", JSON.stringify(mtCols))
}

main()
