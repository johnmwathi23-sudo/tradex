import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("kyc_status")
    .eq("id", user.id)
    .single()

  if (!profile || profile.kyc_status !== "approved") {
    return NextResponse.json({ error: "KYC verification must be approved before withdrawing. Please upload your KYC documents and wait for approval." }, { status: 403 })
  }

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
    .maybeSingle()

  const { data: mtAccounts } = await supabaseAdmin
    .from("mt_accounts")
    .select("id, balance")
    .eq("user_id", user.id)
    .eq("account_type", "real")
    .eq("status", "connected")

  const legacyBalance = account ? Number(account.balance) : 0
  const mtTotalBalance = (mtAccounts || []).reduce((sum: number, a: { balance: number }) => sum + Number(a.balance || 0), 0)
  const totalBalance = legacyBalance + mtTotalBalance

  if (totalBalance < amount) {
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

  if (account) {
    const deductFromLegacy = Math.min(amount, legacyBalance)
    await supabase
      .from("accounts")
      .update({ balance: legacyBalance - deductFromLegacy })
      .eq("user_id", user.id)
  }

  if (mtAccounts && mtAccounts.length > 0) {
    let remaining = amount
    for (const mt of mtAccounts) {
      if (remaining <= 0) break
      const mtBal = Number(mt.balance)
      const deduct = Math.min(remaining, mtBal)
      await supabaseAdmin
        .from("mt_accounts")
        .update({ balance: mtBal - deduct, equity: mtBal - deduct })
        .eq("id", mt.id)
      remaining -= deduct
    }
  }

  return NextResponse.json({
    success: true,
    message: "Withdrawal request submitted for processing.",
    transactionId: tx.id,
    reference: ref,
  })
}
