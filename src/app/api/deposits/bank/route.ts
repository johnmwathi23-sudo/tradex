import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const bankDetails = {
  bankName: "NCBA Bank Kenya",
  accountName: "TradeX Global Ltd",
  accountNumber: "1234567890",
  branch: "Upper Hill Branch, Nairobi",
  swiftCode: "CBAFKENX",
  currency: "USD",
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount } = await req.json()
  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Invalid amount (min $10)" }, { status: 400 })
  }

  const ref = `BNK_${Date.now()}_${user.id.slice(0, 4)}`

  const { data: tx } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "deposit",
      method: "bank_transfer",
      amount,
      currency: "USD",
      status: "pending",
      reference: ref,
      description: "Bank transfer deposit",
    })
    .select()
    .single()

  return NextResponse.json({
    success: true,
    transactionId: tx.id,
    reference: ref,
    bankDetails,
    instructions: `Transfer ${amount} USD to the account below. Use reference ${ref} as the payment description. Your account will be credited within 1-2 business days.`,
  })
}
