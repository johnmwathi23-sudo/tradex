import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: master, error } = await supabaseAdmin
    .from("master_traders")
    .select("*, accounts:user_id(id, balance, equity)")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ master })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  const allowedFields = [
    "win_rate", "total_trades", "roi", "total_pnl",
    "display_name", "bio", "risk_level",
    "total_followers", "performance_fee", "min_investment",
    "default_stop_loss", "default_take_profit"
  ]
  const updates: Record<string, any> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }
  updates.updated_at = new Date().toISOString()

  const { error: updateError } = await supabaseAdmin
    .from("master_traders")
    .update(updates)
    .eq("user_id", user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  const accountUpdates: Record<string, any> = {}
  if (body.balance !== undefined) accountUpdates.balance = body.balance
  if (body.equity !== undefined) accountUpdates.equity = body.equity
  if (Object.keys(accountUpdates).length > 0) {
    accountUpdates.updated_at = new Date().toISOString()
    const { error: balanceError } = await supabaseAdmin
      .from("accounts")
      .update(accountUpdates)
      .eq("user_id", user.id)

    if (balanceError) return NextResponse.json({ error: balanceError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
