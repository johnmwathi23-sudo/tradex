import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const MIN_ACTIVE_DAYS = 5

export async function POST(
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

  const { data: sub } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .select("started_at, status")
    .eq("id", id)
    .single()

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  }

  if (sub.status !== "active") {
    return NextResponse.json({ error: "Subscription is not active" }, { status: 400 })
  }

  const daysActive = (Date.now() - new Date(sub.started_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysActive < MIN_ACTIVE_DAYS) {
    const remainingDays = Math.ceil(MIN_ACTIVE_DAYS - daysActive)
    return NextResponse.json({
      error: `Cannot stop copy trading within ${MIN_ACTIVE_DAYS} days of starting. ${remainingDays} day${remainingDays > 1 ? "s" : ""} remaining.`
    }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .update({ status: "stopped", ended_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
