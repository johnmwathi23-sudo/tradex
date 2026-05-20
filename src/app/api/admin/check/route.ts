import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) return NextResponse.json({ isAdmin: false, error: authError.message })
    if (!user) return NextResponse.json({ isAdmin: false, reason: "no user" })

    const { data, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) return NextResponse.json({ isAdmin: false, error: profileError.message })

    return NextResponse.json({ isAdmin: data?.role === "admin", role: data?.role })
  } catch (err: any) {
    return NextResponse.json({ isAdmin: false, error: err?.message || String(err) }, { status: 500 })
  }
}
