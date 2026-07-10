import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: subscriptions } = await supabase
    .from("copy_trade_subscriptions")
    .select("master_trader_id")
    .eq("follower_id", user.id)
    .in("status", ["active", "paused"])

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json([])
  }

  const masterIds = (subscriptions as { master_trader_id: string }[]).map((s) => s.master_trader_id)

  const { data: masters } = await supabase
    .from("master_traders")
    .select("id, user_id, display_name")
    .in("id", masterIds)

  const masterUserIds = (masters as { user_id: string; display_name: string }[] | null)?.map((m) => m.user_id) ?? []

  if (masterUserIds.length === 0) {
    return NextResponse.json([])
  }

  const { data: trades } = await supabaseAdmin
    .from("trades")
    .select("*")
    .in("user_id", masterUserIds)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50)

  const tradesWithMaster = (trades as Record<string, unknown>[] | null)?.map((trade) => {
    const master = (masters as { user_id: string; display_name: string }[] | null)?.find((m) => m.user_id === trade.user_id)
    return { ...trade, master_name: master?.display_name ?? "Unknown" }
  })

  return NextResponse.json(tradesWithMaster ?? [])
}
