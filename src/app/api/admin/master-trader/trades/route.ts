import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getRealTimePrice, contractSize } from "@/lib/prices"

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

  const { data: master } = await supabaseAdmin
    .from("master_traders")
    .select("id, user_id")
    .eq("user_id", user.id)
    .single()

  if (!master) return NextResponse.json({ error: "Not a master trader" }, { status: 400 })

  const { data: trades, error } = await supabaseAdmin
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = await Promise.all((trades ?? []).map(async (t: any) => {
    if (t.status === "open") {
      const price = await getRealTimePrice(t.symbol)
      if (price) {
        const direction = t.type === "buy" ? 1 : -1
        const rawPnl = Number((direction * (price.mid - Number(t.open_price)) * Number(t.volume) * contractSize(t.symbol)).toFixed(2))
        return { ...t, current_price: price.mid, unrealized_pnl: rawPnl }
      }
    }
    return { ...t, current_price: t.open_price, unrealized_pnl: 0 }
  }))

  return NextResponse.json(enriched)
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

  const { trade_id, stop_loss, take_profit } = await req.json()
  if (!trade_id) return NextResponse.json({ error: "trade_id required" }, { status: 400 })

  const updates: Record<string, any> = {}
  if (stop_loss !== undefined) updates.stop_loss = stop_loss
  if (take_profit !== undefined) updates.take_profit = take_profit

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data: trade } = await supabaseAdmin
    .from("trades")
    .select("id, user_id")
    .eq("id", trade_id)
    .single()

  if (!trade || trade.user_id !== user.id) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 })
  }

  const { error: updateError } = await supabaseAdmin
    .from("trades")
    .update(updates)
    .eq("id", trade_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, ...updates })
}
