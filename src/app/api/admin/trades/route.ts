import { requireAdmin } from "@/lib/admin-guard"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const symbol = searchParams.get("symbol")

  let query = supabaseAdmin
    .from("trades")
    .select("*, profiles!inner(email, first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(200)

  if (status && ["open", "closed", "pending"].includes(status)) {
    query = query.eq("status", status)
  }

  if (symbol) {
    query = query.ilike("symbol", `%${symbol}%`)
  }

  const { data } = await query

  return NextResponse.json(data ?? [])
}
