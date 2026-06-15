import Stripe from "stripe"
import { stripe, getWebhookSecret } from "./client"

export function constructEvent(body: string, signature: string): Stripe.Event {
  return stripe().webhooks.constructEvent(body, signature, getWebhookSecret())
}
