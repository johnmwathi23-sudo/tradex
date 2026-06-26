import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("kyc_status")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.kyc_status !== "submitted" && profile.kyc_status !== "approved")) {
    return NextResponse.json({ error: "KYC documents must be submitted before you can start copy trading." }, { status: 403 })
  }

  const { masterTraderId, allocationPercentage, allocatedAmount, autoTopup } = await request.json()

  if (!masterTraderId || allocationPercentage == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const allocPct = Number(allocationPercentage)
  if (isNaN(allocPct) || allocPct < 1 || allocPct > 100) {
    return NextResponse.json({ error: "Allocation percentage must be between 1 and 100" }, { status: 400 })
  }

  if (allocatedAmount != null && (isNaN(Number(allocatedAmount)) || Number(allocatedAmount) < 0)) {
    return NextResponse.json({ error: "Invalid allocated amount" }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .select("id, status, allocated_amount, max_drawdown, auto_topup")
    .eq("follower_id", user.id)
    .eq("master_trader_id", masterTraderId)
    .in("status", ["active", "paused"])
    .maybeSingle()

  if (existing) {
    if (existing.status === "active") {
      return NextResponse.json({ error: "Already following this trader" }, { status: 409 })
    }
    const { data: resumed, error: resumeErr } = await supabaseAdmin
      .from("copy_trade_subscriptions")
      .update({
        status: "active",
        allocation_percentage: allocPct,
        allocated_amount: allocatedAmount ?? existing.allocated_amount,
        auto_topup: autoTopup ?? existing.auto_topup,
        ended_at: null,
      })
      .eq("id", existing.id)
      .select("*, master_trader:master_traders(*)")
      .single()

    if (resumeErr) {
      return NextResponse.json({ error: resumeErr.message }, { status: 500 })
    }
    return NextResponse.json(resumed, { status: 200 })
  }

  const { data, error } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .insert({
      follower_id: user.id,
      master_trader_id: masterTraderId,
      allocation_percentage: allocPct,
      allocated_amount: allocatedAmount ?? 0,
      auto_topup: autoTopup ?? false,
    })
    .select("*, master_trader:master_traders(*)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
