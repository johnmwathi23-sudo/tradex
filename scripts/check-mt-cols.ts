import { createClient } from "@supabase/supabase-js"

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await s.from("master_traders").select("*").limit(1)
  if (data?.length) console.log(Object.keys(data[0]).join("\n"))
  else console.log("no rows")
}

main()
