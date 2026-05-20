import { requireAdmin } from "@/lib/admin-guard"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = await createClient()
  const { data } = await supabase
    .from("transactions")
    .select("*, profiles!inner(email, first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(100)

  return NextResponse.json(data ?? [])
}
