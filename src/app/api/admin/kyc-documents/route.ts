import { requireAdmin } from "@/lib/admin-guard"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const { data } = await supabaseAdmin
    .from("kyc_documents")
    .select("*, profiles!inner(email, first_name, last_name)")
    .order("created_at", { ascending: false })

  return NextResponse.json(data ?? [])
}
