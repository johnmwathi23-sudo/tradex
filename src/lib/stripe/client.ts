import Stripe from "stripe"

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-05-27.dahlia",
  })
}

export const stripe = getStripe

export function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET!
}

export function getPublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
}
