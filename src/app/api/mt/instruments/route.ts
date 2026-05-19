import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("instruments")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("symbol", { ascending: true })

  return NextResponse.json(data ?? [])
}
