import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select("*, profiles:user_id(email, first_name, last_name)")
    .eq("type", "deposit")
    .eq("method", "crypto_usdt")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deposits: data })
}
