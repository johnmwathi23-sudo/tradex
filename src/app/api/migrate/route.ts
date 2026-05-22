import { NextResponse } from "next/server"

export async function GET() {
  const sql = `ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 5;`
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
  }

  try {
    const res = await fetch(`${supabaseUrl}/pg/meta/default/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "duration column added to trades" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
