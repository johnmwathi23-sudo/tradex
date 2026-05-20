import { requireAdmin } from "@/lib/admin-guard"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("*, accounts(*)")
    .order("created_at", { ascending: false })

  return NextResponse.json(data ?? [])
}
