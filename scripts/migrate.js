const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

const MIGRATION_ORDER = [
  "schema.sql",
  "crypto_schema.sql",
  "migration_admin.sql",
  "migration_ai_trading.sql",
  "migration_circle.sql",
  "migration_copy_trading_schema_fixes.sql",
  "migration_fix_trades_fk.sql",
  "migration_phase6.sql",
  "migration_phase7.sql",
  "migration_ta_engine.sql",
  "migration_add_duration.sql",
  "seed_master_traders.sql",
]

const SUPABASE_DIR = path.resolve(__dirname, "..", "supabase")

async function runMigrations() {
  const client = new Client({
    host: "aws-1-eu-central-1.pooler.supabase.com",
    port: 5432,
    user: "postgres.yuarpxzctinouecuqfai",
    password: "985_#-r*Gv#2r-T",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  console.log("Connecting to database...")
  await client.connect()
  console.log("Connected!\n")

  for (const file of MIGRATION_ORDER) {
    const filePath = path.join(SUPABASE_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${file} - not found`)
      continue
    }
    const sql = fs.readFileSync(filePath, "utf8")
    console.log(`Running ${file}...`)
    try {
      await client.query(sql)
      console.log(`  OK`)
    } catch (err) {
      console.error(`  ERROR: ${err.message}`)
    }
  }

  await client.end()
  console.log("\nAll migrations complete!")
}

runMigrations().catch((err) => {
  console.error("Failed:", err.message)
  process.exit(1)
})
