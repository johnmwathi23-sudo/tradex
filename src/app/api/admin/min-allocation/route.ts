import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { minInvestment } = await req.json()
  if (minInvestment == null || isNaN(Number(minInvestment)) || Number(minInvestment) < 1) {
    return NextResponse.json({ error: "Invalid minimum investment amount" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("master_traders")
    .update({ min_investment: Number(minInvestment), updated_at: new Date().toISOString() })
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id, display_name, min_investment")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, updated: data?.length ?? 0 })
}
