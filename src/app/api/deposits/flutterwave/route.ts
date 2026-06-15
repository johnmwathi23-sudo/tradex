import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount, currency } = await req.json()
  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Invalid amount (min $10)" }, { status: 400 })
  }

  const txRef = `PRIMESTONE_FLW_${Date.now()}_${user.id.slice(0, 8)}`

  const { data: tx } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "deposit",
      method: "flutterwave",
      amount,
      currency: currency || "USD",
      status: "pending",
      reference: txRef,
      description: "Flutterwave deposit",
    })
    .select()
    .single()

  return NextResponse.json({
    success: true,
    transactionId: tx.id,
    txRef,
    publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
    amount,
    currency: currency || "USD",
  })
}
