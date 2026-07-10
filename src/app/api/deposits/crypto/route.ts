import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount, tx_hash, proof_url } = await req.json()

  if (!amount || amount < 200) {
    return NextResponse.json({ error: "Minimum deposit is $200" }, { status: 400 })
  }
  if (!tx_hash || typeof tx_hash !== "string") {
    return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "deposit",
      method: "crypto_usdt",
      amount,
      status: "pending",
      proof_url: proof_url || null,
      metadata: { tx_hash },
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction: data })
}
