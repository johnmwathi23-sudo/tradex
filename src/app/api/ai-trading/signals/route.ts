import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("ai_trading_signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  return NextResponse.json(data ?? [])
}
