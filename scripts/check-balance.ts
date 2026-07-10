import { createClient } from "@supabase/supabase-js"

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  for (const table of ["mt_accounts", "accounts", "wallets", "balances"]) {
    const { data, error } = await supabase.from(table).select("*").limit(1)
    if (!error) {
      console.log(`${table} columns:`, Object.keys(data?.[0] ?? {}))
      console.log(`${table} sample:`, JSON.stringify(data?.[0] ?? null, null, 2))
    } else {
      console.log(`${table}:`, error.message)
    }
  }
}

main()
