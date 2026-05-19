import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const stkCallback = body?.Body?.stkCallback

  if (!stkCallback) {
    return NextResponse.json({ error: "Invalid callback" }, { status: 400 })
  }

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback
  const mpesaStatus = ResultCode === "0" ? "success" : "failed"
  const mpesaReceipt = CallbackMetadata?.Item?.find(
    (i: any) => i.Key === "MpesaReceiptNumber"
  )?.Value || null

  const { data: mpesaTx } = await supabaseAdmin
    .from("mpesa_transactions")
    .update({
      status: mpesaStatus,
      mpesa_receipt_number: mpesaReceipt,
      result_code: ResultCode,
      result_desc: ResultDesc,
    })
    .eq("checkout_request_id", CheckoutRequestID)
    .select()
    .single()

  if (!mpesaTx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  if (mpesaStatus === "success") {
    await supabaseAdmin
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", mpesaTx.transaction_id)

    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("user_id, amount")
      .eq("id", mpesaTx.transaction_id)
      .single()

    if (tx) {
      const { data: account } = await supabaseAdmin
        .from("accounts")
        .select("balance")
        .eq("user_id", tx.user_id)
        .single()

      if (account) {
        await supabaseAdmin
          .from("accounts")
          .update({ balance: Number(account.balance) + Number(tx.amount) })
          .eq("user_id", tx.user_id)
      }
    }
  } else {
    await supabaseAdmin
      .from("transactions")
      .update({ status: "failed" })
      .eq("id", mpesaTx.transaction_id)
  }

  return NextResponse.json({ success: true })
}
