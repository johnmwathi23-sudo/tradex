import { requireAdmin } from "@/lib/admin-guard"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = await createClient()
  const { data } = await supabase
    .from("master_traders")
    .select("*, profiles!inner(email, first_name, last_name)")
    .order("created_at", { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { email, display_name, bio, risk_level, performance_fee, min_investment } = await req.json()

    if (!email || !display_name) {
      return NextResponse.json({ error: "Email and display name required" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "User not found with that email" }, { status: 404 })
    }

    const { data: existing } = await supabaseAdmin
      .from("master_traders")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "User is already a master trader" }, { status: 409 })
    }

    const { data, error: createErr } = await supabaseAdmin
      .from("master_traders")
      .insert({
        user_id: profile.id,
        display_name,
        bio: bio || null,
        risk_level: risk_level || "medium",
        performance_fee: performance_fee || 20,
        min_investment: min_investment || 10,
        is_verified: true,
        is_active: true,
      })
      .select()
      .single()

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, trader: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
