import { Client } from "pg"

const client = new Client({
  host: "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.yuarpxzctinouecuqfai",
  password: "985_#-r*Gv#2r-T",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

async function main() {
  await client.connect()

  const { rows: mt } = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='master_traders' ORDER BY ordinal_position"
  )
  console.log("master_traders:", mt.map((r: any) => r.column_name).join(", "))

  const { rows: tr } = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='trades' ORDER BY ordinal_position"
  )
  console.log("trades:", tr.map((r: any) => r.column_name).join(", "))

  const { rows: ac } = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='accounts' ORDER BY ordinal_position"
  )
  console.log("accounts:", ac.map((r: any) => r.column_name).join(", "))

  // Check flossin's accounts
  const { rows: flossinAccts } = await client.query(
    "SELECT * FROM accounts WHERE user_id = 'b94dde42-56f7-44a5-aeee-d3132e017f41'"
  )
  console.log("Flossin accounts:", JSON.stringify(flossinAccts))

  await client.end()
}

main().catch(console.error)
