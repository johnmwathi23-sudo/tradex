import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("mt_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { login_id, platform, server, broker, account_type, investor_password } = await req.json()

  if (!login_id || !platform || !server) {
    return NextResponse.json({ error: "Login ID, platform, and server are required" }, { status: 400 })
  }
  if (!["mt4", "mt5"].includes(platform)) {
    return NextResponse.json({ error: "Platform must be mt4 or mt5" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("mt_accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("login_id", login_id)
    .eq("platform", platform)
    .single()

  if (existing) {
    return NextResponse.json({ error: "This account is already linked" }, { status: 409 })
  }

  const count = await supabase
    .from("mt_accounts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const isDefault = (count.count ?? 0) === 0

  const { data, error } = await supabase
    .from("mt_accounts")
    .insert({
      user_id: user.id,
      login_id,
      platform,
      server,
      broker: broker || null,
      account_type: account_type || "real",
      investor_password: investor_password || null,
      status: "connected",
      is_default: isDefault,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
