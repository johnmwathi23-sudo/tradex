"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { CreditCard, Loader2, CheckCircle } from "lucide-react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError("")

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/deposit`,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message || "Payment failed")
      setLoading(false)
    } else {
      onSuccess()
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20 text-sm text-[#FF1744]">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Pay ${amount.toFixed(2)}
      </button>
    </form>
  )
}

export default function DepositPage() {
  const [amount, setAmount] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleInitPayment(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/deposits/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setClientSecret(data.clientSecret)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Deposit</h1>
        </div>
        <Card className="p-6 max-w-xl">
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="text-[#00C853] mx-auto" />
            <div className="text-lg font-bold text-[#00C853]">Payment Successful</div>
            <p className="text-sm text-[#A0A0B0]">
              Your deposit of ${parseFloat(amount).toFixed(2)} has been confirmed.
              Your account has been credited and the USDT conversion is being processed.
            </p>
            <button
              onClick={() => { setSuccess(false); setAmount(""); setClientSecret(null) }}
              className="w-full py-3 rounded-xl bg-white/5 text-[#A0A0B0] text-sm font-medium hover:bg-white/10 transition"
            >
              Make Another Deposit
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Deposit</h1>
        <p className="text-sm text-[#A0A0B0] mt-1">Fund your account via card payment</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/20 w-fit">
          <CreditCard size={22} className="text-[#D4A843]" />
          <div>
            <div className="text-sm font-semibold text-[#F5F5F5]">Card Payment</div>
            <div className="text-xs text-[#A0A0B0]">Visa, Mastercard, AMEX</div>
          </div>
        </div>
      </div>

      <Card className="p-6 max-w-xl">
        {!clientSecret ? (
          <form onSubmit={handleInitPayment} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20 text-sm text-[#FF1744]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Continue to Payment
            </button>
          </form>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm amount={parseFloat(amount)} onSuccess={() => setSuccess(true)} />
          </Elements>
        )}
      </Card>
    </div>
  )
}
