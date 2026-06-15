import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { constructEvent } from "@/lib/stripe/webhook"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: ReturnType<typeof constructEvent>
  try {
    event = constructEvent(body, signature)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const paymentIntent = event.data.object as any
  const piId = paymentIntent.id

  switch (event.type) {
    case "payment_intent.succeeded": {
      const { data: existing } = await supabaseAdmin
        .from("payments")
        .select("id, status")
        .eq("stripe_payment_intent_id", piId)
        .single()

      if (!existing || existing.status !== "initiated") {
        return NextResponse.json({ status: "skipped" })
      }

      const amountUsd = paymentIntent.amount / 100
      const usdtAmount = amountUsd

      await supabaseAdmin
        .from("payments")
        .update({
          stripe_event_id: event.id,
          status: "stripe_confirmed",
          usdt_amount: usdtAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      const user_id = paymentIntent.metadata?.user_id
      if (user_id) {
        const { data: account } = await supabaseAdmin
          .from("accounts")
          .select("balance")
          .eq("user_id", user_id)
          .single()

        if (account) {
          await supabaseAdmin
            .from("accounts")
            .update({ balance: Number(account.balance) + amountUsd })
            .eq("user_id", user_id)
        }
      }

      const { data: job } = await supabaseAdmin
        .from("conversion_jobs")
        .insert({
          payment_id: existing.id,
          usdt_amount: usdtAmount,
          status: "queued",
        })
        .select()
        .single()

      await supabaseAdmin.from("audit_logs").insert({
        payment_id: existing.id,
        conversion_job_id: job?.id,
        event_type: "payment_intent.succeeded",
        status_from: "initiated",
        status_to: "stripe_confirmed",
        metadata: { stripe_event_id: event.id, amount_usd: amountUsd },
      })

      break
    }

    case "payment_intent.payment_failed": {
      const { data: failed } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("stripe_payment_intent_id", piId)
        .single()

      if (failed) {
        await supabaseAdmin
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", failed.id)

        await supabaseAdmin.from("audit_logs").insert({
          payment_id: failed.id,
          event_type: "payment_intent.payment_failed",
          status_from: "initiated",
          status_to: "failed",
          metadata: { stripe_event_id: event.id, error: paymentIntent.last_payment_error },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
