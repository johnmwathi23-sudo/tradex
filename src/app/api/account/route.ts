import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: mtAccounts } = await supabase
    .from("mt_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  return NextResponse.json({ profile, account, mtAccounts })
}
