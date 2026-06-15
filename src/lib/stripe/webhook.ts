import Stripe from "stripe"
import { stripe, STRIPE_WEBHOOK_SECRET } from "./client"

export function constructEvent(body: string, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
}
