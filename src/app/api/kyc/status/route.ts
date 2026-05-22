import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("kyc_status")
    .eq("id", user.id)
    .single()

  const { data: documents } = await supabaseAdmin
    .from("kyc_documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({
    kyc_status: profile?.kyc_status || "pending",
    documents: documents || [],
  })
}
