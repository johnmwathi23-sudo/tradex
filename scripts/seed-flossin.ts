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

const FLOSSIN_USER_ID = "b94dde42-56f7-44a5-aeee-d3132e017f41"

async function main() {
  await client.connect()
  console.log("Connected\n")

  // 1. Add total_pnl column
  console.log("Adding total_pnl to master_traders...")
  await client.query("ALTER TABLE public.master_traders ADD COLUMN IF NOT EXISTS total_pnl DECIMAL(18,2) DEFAULT 0.00")
  console.log("  OK")

  // 2. Create account for flossin
  console.log("Creating account for flossin...")
  const { rows: existingAcct } = await client.query(
    "SELECT id FROM accounts WHERE user_id = $1", [FLOSSIN_USER_ID]
  )
  if (existingAcct.length === 0) {
    await client.query(
      `INSERT INTO accounts (user_id, type, balance, equity, leverage, currency, status)
       VALUES ($1, 'pro', 12897.00, 12897.00, '1:2000', 'USD', 'active')`,
      [FLOSSIN_USER_ID]
    )
    console.log("  Created account with $12,897 balance")
  } else {
    await client.query(
      `UPDATE accounts SET balance = 12897.00, equity = 12897.00, updated_at = NOW() WHERE user_id = $1`,
      [FLOSSIN_USER_ID]
    )
    console.log("  Updated account balance to $12,897")
  }

  // 3. Update master_trader stats
  console.log("Updating master_trader stats...")
  await client.query(
    `UPDATE master_traders SET
       win_rate = 78.3,
       total_trades = 851,
       roi = 38.0,
       total_followers = 156,
       total_pnl = 4900.00,
       is_verified = true,
       updated_at = NOW()
     WHERE user_id = $1`,
    [FLOSSIN_USER_ID]
  )
  console.log("  Win rate: 78.3%, Total trades: 851, ROI: 38%, Total P&L: +$4,900")

  // 4. Verify KYC
  console.log("Verifying KYC...")
  const { rows: existingKyc } = await client.query(
    "SELECT id FROM kyc_documents WHERE user_id = $1", [FLOSSIN_USER_ID]
  )
  if (existingKyc.length === 0) {
    await client.query(
      `INSERT INTO kyc_documents (user_id, document_type, document_url, status)
       VALUES ($1, 'passport', 'https://placeholder.com/kyc-flossin', 'approved')`,
      [FLOSSIN_USER_ID]
    )
    console.log("  Created and approved KYC document")
  } else {
    await client.query(
      "UPDATE kyc_documents SET status = 'approved' WHERE user_id = $1",
      [FLOSSIN_USER_ID]
    )
    console.log("  Approved existing KYC")
  }
  await client.query(
    "UPDATE profiles SET kyc_status = 'approved', updated_at = NOW() WHERE id = $1",
    [FLOSSIN_USER_ID]
  )
  console.log("  Profile kyc_status set to approved")

  // 5. Get the account ID for trades
  const { rows: acct } = await client.query(
    "SELECT id FROM accounts WHERE user_id = $1 LIMIT 1", [FLOSSIN_USER_ID]
  )
  const accountId = acct[0].id

  // 6. Create 4 open trades
  console.log("Creating 4 open trades...")
  await client.query("DELETE FROM trades WHERE user_id = $1 AND status = 'open'", [FLOSSIN_USER_ID])

  const trades = [
    { symbol: "EURUSD", type: "buy", volume: 0.5, open_price: 1.0845, profit: 1250.00 },
    { symbol: "GBPUSD", type: "buy", volume: 0.3, open_price: 1.2650, profit: 890.00 },
    { symbol: "BTCUSD", type: "sell", volume: 0.1, open_price: 67500, profit: 1580.00 },
    { symbol: "XAUUSD", type: "buy", volume: 0.2, open_price: 2330.0, profit: 1180.00 },
  ]

  for (const t of trades) {
    await client.query(
      `INSERT INTO trades (user_id, account_id, symbol, type, volume, open_price, profit, status, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', 60)`,
      [FLOSSIN_USER_ID, accountId, t.symbol, t.type, t.volume, t.open_price, t.profit]
    )
    console.log(`  ${t.symbol} ${t.type} ${t.volume} lots @ ${t.open_price} (P&L: +$${t.profit})`)
  }

  await client.end()
  console.log("\nDone! Flossin seeded successfully.")
}

main().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
