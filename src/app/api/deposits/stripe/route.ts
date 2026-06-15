import { stripe } from "../../../../lib/stripe/client"
import { createClient } from "../../../../lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount } = await req.json()
  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Minimum deposit is $10" }, { status: 400 })
  }

  const amountCents = Math.round(amount * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata: {
      user_id: user.id,
    },
    automatic_payment_methods: { enabled: true },
  })

  const { error: dbError } = await supabase.from("payments").insert({
    user_id: user.id,
    stripe_payment_intent_id: paymentIntent.id,
    amount_usd: amount,
    status: "initiated",
    idempotency_key: paymentIntent.id,
  })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  })
}
