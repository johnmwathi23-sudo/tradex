import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: master, error: masterError } = await supabaseAdmin
    .from("master_traders")
    .select("*, profiles!inner(id, email, first_name, last_name, avatar_url)")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (masterError || !master) {
    return NextResponse.json({ error: "Master trader not found" }, { status: 404 })
  }

  const { data: trades } = await supabaseAdmin
    .from("trades")
    .select("*")
    .eq("user_id", master.user_id)
    .order("created_at", { ascending: false })
    .limit(50)

  const { data: subscriberCount } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("master_trader_id", id)
    .eq("status", "active")

  return NextResponse.json({
    master,
    trades: trades || [],
    subscriber_count: subscriberCount?.length ?? 0,
  })
}
