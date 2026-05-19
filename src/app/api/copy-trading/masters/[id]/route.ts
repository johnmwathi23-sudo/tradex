import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("master_traders")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Master trader not found" }, { status: 404 })
  }

  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", data.user_id)
    .order("created_at", { ascending: false })
    .limit(20)

  return NextResponse.json({ ...data, recent_trades: trades ?? [] })
}
