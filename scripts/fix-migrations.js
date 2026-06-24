const { Client } = require("pg")

const client = new Client({
  host: "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.yuarpxzctinouecuqfai",
  password: "985_#-r*Gv#2r-T",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

const FIXES = [
  // --- migration_circle.sql fixes (safe re-run) ---
  `ALTER TABLE public.conversion_jobs DROP COLUMN IF EXISTS okx_order_id`,
  `ALTER TABLE public.conversion_jobs DROP COLUMN IF EXISTS okx_fill_price`,
  `ALTER TABLE public.crypto_transfers ALTER COLUMN wallet_type SET DEFAULT 'circle'`,

  // --- migration_phase6.sql fixes ---
  // Create missing tables for phase6
  `CREATE TABLE IF NOT EXISTS public.mpesa_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    phone TEXT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    mpesa_code TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Create mt_accounts if needed
  `CREATE TABLE IF NOT EXISTS public.mt_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    account_id TEXT NOT NULL,
    account_type TEXT DEFAULT 'demo',
    balance DECIMAL(18,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Enable RLS on these tables
  `ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.mt_accounts ENABLE ROW LEVEL SECURITY`,
  // Add policies (drop first to avoid conflicts)
  `DROP POLICY IF EXISTS "Users create mpesa" ON public.mpesa_transactions`,
  `CREATE POLICY "Users create mpesa" ON public.mpesa_transactions FOR INSERT WITH CHECK (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "Users update own mpesa" ON public.mpesa_transactions`,
  `CREATE POLICY "Users update own mpesa" ON public.mpesa_transactions FOR UPDATE USING (auth.uid() = user_id)`,

  // --- migration_add_duration.sql fix (column may already exist) ---
  `ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 5`,

  // --- seed_master_traders.sql fix ---
  // Ensure unique constraint exists on auth.users.email
  `ALTER TABLE auth.users ADD CONSTRAINT IF NOT EXISTS users_email_key UNIQUE (email)`,
]

async function runFixes() {
  await client.connect()
  console.log("Connected\n")

  for (const sql of FIXES) {
    const label = sql.split("\n")[0].substring(0, 80)
    process.stdout.write(label + "... ")
    try {
      await client.query(sql)
      console.log("OK")
    } catch (err) {
      console.log("ERROR: " + err.message)
    }
  }

  await client.end()
  console.log("\nFixes complete")
}

runFixes().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
