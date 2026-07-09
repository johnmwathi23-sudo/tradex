const { Client } = require("pg")

const client = new Client({
  host: "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.yuarpxzctinouecuqfai",
  password: "985_#-r*Gv#2r-T",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})

async function run() {
  await client.connect()

  // Check and add unique constraint
  const res = await client.query(
    "SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key' AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')"
  )
  if (res.rows.length === 0) {
    await client.query("ALTER TABLE auth.users ADD CONSTRAINT users_email_key UNIQUE (email)")
    console.log("Added users_email_key constraint")
  } else {
    console.log("Constraint already exists")
  }

  // Insert seed users
  await client.query(`
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES
      (gen_random_uuid(), 'masterfx@primestone.com', crypt('MasterFX123!', gen_salt('bf')), NOW(), NOW(), NOW()),
      (gen_random_uuid(), 'flossin@primestone.com', crypt('Flossin123!', gen_salt('bf')), NOW(), NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
  `)
  console.log("Seed users inserted")

  // Create profiles
  await client.query(`
    INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
    SELECT id, email,
      CASE WHEN email = 'masterfx@primestone.com' THEN 'Master' ELSE 'Flossin' END,
      CASE WHEN email = 'masterfx@primestone.com' THEN 'FX' ELSE 'Trader' END,
      NOW(), NOW()
    FROM auth.users
    WHERE email IN ('masterfx@primestone.com', 'flossin@primestone.com')
    ON CONFLICT (id) DO NOTHING
  `)
  console.log("Seed profiles created")

  // Create master trader records
  await client.query(`
    INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, is_verified, is_active, created_at, updated_at)
    SELECT
      p.id, 'Master FX',
      'Professional forex trader with 12+ years experience. Specializes in EUR/USD and GBP/USD pairs.',
      47.8, 78.5, 234, 1289, 'medium', 25.00, 50.00, TRUE, TRUE, NOW(), NOW()
    FROM public.profiles p
    WHERE p.email = 'masterfx@primestone.com'
    AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id)
  `)
  await client.query(`
    INSERT INTO public.master_traders (user_id, display_name, bio, roi, win_rate, total_followers, total_trades, risk_level, performance_fee, min_investment, is_verified, is_active, created_at, updated_at)
    SELECT
      p.id, 'Flossin',
      'Crypto and indices specialist. 8 years trading BTC, ETH, and NASDAQ.',
      32.4, 82.1, 156, 847, 'low', 20.00, 25.00, TRUE, TRUE, NOW(), NOW()
    FROM public.profiles p
    WHERE p.email = 'flossin@primestone.com'
    AND NOT EXISTS (SELECT 1 FROM public.master_traders mt WHERE mt.user_id = p.id)
  `)
  console.log("Seed master traders created")

  await client.end()
  console.log("Seed complete")
}

run().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
