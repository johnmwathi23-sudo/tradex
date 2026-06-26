import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getRealTimePrice, contractSize } from "@/lib/prices"

export async function GET(
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

  const { data: master, error } = await supabase
    .from("master_traders")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!master) {
    return NextResponse.json({ error: "Master trader not found" }, { status: 404 })
  }

  const { data: trades } = await supabaseAdmin
    .from("trades")
    .select("*")
    .eq("user_id", master.user_id)
    .order("created_at", { ascending: false })
    .limit(20)

  const enrichedTrades = await Promise.all((trades ?? []).map(async (t: any) => {
    if (t.status === "open") {
      const price = await getRealTimePrice(t.symbol)
      if (price) {
        const direction = t.type === "buy" ? 1 : -1
        const rawPnl = Number((direction * (price.mid - Number(t.open_price)) * Number(t.volume) * contractSize(t.symbol)).toFixed(2))
        return { ...t, current_price: price.mid, unrealized_pnl: rawPnl, mark_price: price.mid }
      }
      return { ...t, current_price: t.open_price, unrealized_pnl: 0, mark_price: t.open_price }
    }
    return { ...t, current_price: t.close_price || t.open_price, unrealized_pnl: t.profit || 0, mark_price: t.close_price || t.open_price }
  }))

  return NextResponse.json({ ...master, recent_trades: enrichedTrades })
}
