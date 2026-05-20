import { supabaseAdmin } from "@/lib/supabase/admin"
import { executeSignal } from "@/lib/auto-trader"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: any) {
  const { id } = params

  const result = await executeSignal(id)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  const { data: trade } = await supabaseAdmin
    .from("trades")
    .select("*, signal:signal_id(*)")
    .eq("id", result.tradeId)
    .single()

  return NextResponse.json({
    success: true,
    trade,
    copiedTo: result.copiedTo || 0,
  })
}
