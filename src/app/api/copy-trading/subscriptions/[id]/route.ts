import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const MIN_ACTIVE_DAYS = 5

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await _request.json()
  const updates: Record<string, unknown> = {}

  if (body.allocation_percentage != null) {
    const pct = Number(body.allocation_percentage)
    if (isNaN(pct) || pct < 75 || pct > 100) {
      return NextResponse.json({ error: "Allocation percentage must be between 75 and 100" }, { status: 400 })
    }
    updates.allocation_percentage = pct
  }

  if (body.allocated_amount != null) {
    const amt = Number(body.allocated_amount)
    if (isNaN(amt) || amt < 200) {
      return NextResponse.json({ error: "Minimum allocated amount is $200" }, { status: 400 })
    }
    updates.allocated_amount = amt
  }

  if (body.auto_topup != null) {
    updates.auto_topup = Boolean(body.auto_topup)
  }

  if (body.status != null) {
    if (!["active", "paused", "stopped"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (body.status === "paused" || body.status === "stopped") {
      const { data: sub } = await supabaseAdmin
        .from("copy_trade_subscriptions")
        .select("started_at, status")
        .eq("id", id)
        .single()

      if (sub && sub.status === "active") {
        const daysActive = (Date.now() - new Date(sub.started_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysActive < MIN_ACTIVE_DAYS) {
          const remainingDays = Math.ceil(MIN_ACTIVE_DAYS - daysActive)
          return NextResponse.json({
            error: `Cannot pause/stop within ${MIN_ACTIVE_DAYS} days of starting. ${remainingDays} day${remainingDays > 1 ? "s" : ""} remaining.`
          }, { status: 403 })
        }
      }
    }

    updates.status = body.status
    if (body.status === "stopped") {
      updates.ended_at = new Date().toISOString()
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .update(updates)
    .eq("id", id)
    .select("*, master_trader:master_traders(*)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}
