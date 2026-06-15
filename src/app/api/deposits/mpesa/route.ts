import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET
const MPESA_PASSKEY = process.env.MPESA_PASSKEY
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL

async function getMpesaToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64")
  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  )
  const data = await res.json()
  return data.access_token
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { phone, amount } = await req.json()
    if (!phone || !amount || amount < 10) {
      return NextResponse.json({ error: "Invalid phone or amount (min $10)" }, { status: 400 })
    }

    const token = await getMpesaToken()
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64")

    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: phone.replace(/\D/g, ""),
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: phone.replace(/\D/g, ""),
          CallBackURL: `${MPESA_CALLBACK_URL}/api/deposits/mpesa/callback`,
          AccountReference: `PRIMESTONE_${user.id.slice(0, 8)}`,
          TransactionDesc: "Primestone Markets Deposit",
        }),
      }
    )
    const stkData = await stkResponse.json()

    if (stkData.ResponseCode !== "0") {
      return NextResponse.json({ error: stkData.ResponseDescription || "M-Pesa request failed" }, { status: 400 })
    }

    const { data: tx } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "deposit",
        method: "mpesa",
        amount,
        currency: "USD",
        status: "processing",
        reference: stkData.MerchantRequestID,
        description: `M-Pesa deposit from ${phone}`,
      })
      .select()
      .single()

    await supabase.from("mpesa_transactions").insert({
      transaction_id: tx.id,
      user_id: user.id,
      phone_number: phone.replace(/\D/g, ""),
      amount,
      merchant_request_id: stkData.MerchantRequestID,
      checkout_request_id: stkData.CheckoutRequestID,
      type: "deposit",
      status: "pending",
    })

    return NextResponse.json({
      success: true,
      message: "STK push sent. Check your phone to complete payment.",
      checkoutRequestId: stkData.CheckoutRequestID,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
