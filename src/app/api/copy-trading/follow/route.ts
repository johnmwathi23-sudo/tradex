import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { masterTraderId, allocationPercentage, allocatedAmount } = await request.json()

  if (!masterTraderId || !allocationPercentage) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("copy_trade_subscriptions")
    .select("id")
    .eq("follower_id", user.id)
    .eq("master_trader_id", masterTraderId)
    .eq("status", "active")
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Already following this trader" }, { status: 409 })
  }

  const { data, error } = await supabase
    .from("copy_trade_subscriptions")
    .insert({
      follower_id: user.id,
      master_trader_id: masterTraderId,
      allocation_percentage: allocationPercentage,
      allocated_amount: allocatedAmount ?? 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
