const { Client } = require("pg")

const c = new Client({
  host: "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.yuarpxzctinouecuqfai",
  password: "985_#-r*Gv#2r-T",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})

async function run() {
  await c.connect()

  // Pending transactions (withdrawals pending admin approval)
  const pendingTx = await c.query(
    "SELECT id, user_id, type, method, amount, currency, status, created_at FROM public.transactions WHERE status = 'pending' ORDER BY created_at DESC"
  )
  console.log("=== PENDING TRANSACTIONS (withdrawals) ===")
  if (pendingTx.rows.length === 0) console.log("(none)")
  else console.log(JSON.stringify(pendingTx.rows, null, 2))

  // Initiated payments (Stripe deposits not yet confirmed)
  const initiatedPm = await c.query(
    "SELECT id, user_id, stripe_payment_intent_id, amount_usd, status, created_at FROM public.payments WHERE status = 'initiated' ORDER BY created_at DESC"
  )
  console.log("\n=== INITIATED PAYMENTS (Stripe deposits) ===")
  if (initiatedPm.rows.length === 0) console.log("(none)")
  else console.log(JSON.stringify(initiatedPm.rows, null, 2))

  // Payments summary
  const pmSummary = await c.query("SELECT status, COUNT(*)::int as count FROM public.payments GROUP BY status ORDER BY status")
  console.log("\n=== PAYMENTS SUMMARY ===")
  if (pmSummary.rows.length === 0) console.log("(none)")
  else console.log(JSON.stringify(pmSummary.rows, null, 2))

  // Transactions summary
  const txSummary = await c.query("SELECT status, COUNT(*)::int as count FROM public.transactions GROUP BY status ORDER BY status")
  console.log("\n=== TRANSACTIONS SUMMARY ===")
  if (txSummary.rows.length === 0) console.log("(none)")
  else console.log(JSON.stringify(txSummary.rows, null, 2))

  await c.end()
}

run().catch((e) => console.error(e.message))
