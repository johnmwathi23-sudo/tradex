import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

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

  return NextResponse.json({ ...master, recent_trades: trades ?? [] })
}
