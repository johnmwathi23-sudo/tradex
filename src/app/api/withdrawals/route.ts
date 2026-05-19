import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount, method, details } = await req.json()
  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Invalid amount (min $10)" }, { status: 400 })
  }
  if (!method || !details) {
    return NextResponse.json({ error: "Method and details required" }, { status: 400 })
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("balance")
    .eq("user_id", user.id)
    .single()

  if (!account || Number(account.balance) < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
  }

  const ref = `WD_${user.id.slice(0, 4)}_${Date.now()}`

  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "withdrawal",
      method,
      amount,
      currency: "USD",
      status: "pending",
      reference: ref,
      description: `Withdrawal via ${method} - ${details}`,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase
    .from("accounts")
    .update({ balance: Number(account.balance) - amount })
    .eq("user_id", user.id)

  return NextResponse.json({
    success: true,
    message: "Withdrawal request submitted for processing.",
    transactionId: tx.id,
    reference: ref,
  })
}
