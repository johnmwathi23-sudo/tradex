import { requireAdmin } from "@/lib/admin-guard"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = await createClient()

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })

  const { count: pendingKyc } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("kyc_status", "pending")

  const { count: pendingTx } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: activeTraders } = await supabase
    .from("master_traders")
    .select("id", { count: "exact", head: true })
    .eq("is_verified", true)

  const { count: totalDeposits } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("type", "deposit")
    .eq("status", "completed")

  const { count: totalWithdrawals } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("type", "withdrawal")
    .eq("status", "completed")

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    pendingKyc: pendingKyc ?? 0,
    pendingTransactions: pendingTx ?? 0,
    activeTraders: activeTraders ?? 0,
    completedDeposits: totalDeposits ?? 0,
    completedWithdrawals: totalWithdrawals ?? 0,
  })
}
