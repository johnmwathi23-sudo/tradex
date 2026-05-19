import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("trades")
    .select("*, mt_accounts!inner(login_id, platform, server)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { mt_account_id, symbol, type, volume, stop_loss, take_profit } = await req.json()

  if (!mt_account_id || !symbol || !type || !volume) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data: account } = await supabase
    .from("mt_accounts")
    .select("id, user_id, login_id, platform")
    .eq("id", mt_account_id)
    .single()

  if (!account) return NextResponse.json({ error: "MT account not found" }, { status: 404 })
  if (account.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const price = type === "buy" ? 1.1050 + Math.random() * 0.002 : 1.1050 - Math.random() * 0.002

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      account_id: mt_account_id,
      symbol,
      type,
      volume: parseFloat(volume),
      open_price: parseFloat(price.toFixed(5)),
      stop_loss: stop_loss || null,
      take_profit: take_profit || null,
      status: "open",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(trade, { status: 201 })
}
