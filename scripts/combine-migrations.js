const fs = require("fs")
const path = require("path")

const FILES = [
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
]

const supabaseDir = path.resolve(__dirname, "..", "supabase")
const outPath = path.resolve(__dirname, "..", "all-migrations.sql")

let combined = "-- Tradex - Combined Database Migrations\n-- Generated: " + new Date().toISOString() + "\n\n"

for (const file of FILES) {
  const filePath = path.join(supabaseDir, file)
  const sql = fs.readFileSync(filePath, "utf8")
  combined += "-- ================================================================\n"
  combined += "-- File: " + file + "\n"
  combined += "-- ================================================================\n\n"
  combined += sql + "\n\n"
}

fs.writeFileSync(outPath, combined, "utf8")
console.log("Created: " + outPath)
console.log("Size: " + (combined.length / 1024).toFixed(1) + " KB")
