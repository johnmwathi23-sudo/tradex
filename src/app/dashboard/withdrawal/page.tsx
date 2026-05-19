"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Smartphone, CreditCard, Bitcoin, Building2 } from "lucide-react"

const methods = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
  { id: "bank_transfer", label: "Bank Transfer", icon: Building2 },
  { id: "flutterwave", label: "Card", icon: CreditCard },
  { id: "crypto_usdt", label: "USDT (TRC20)", icon: Bitcoin },
]

export default function WithdrawalPage() {
  const [method, setMethod] = useState("mpesa")
  const [amount, setAmount] = useState("")
  const [details, setDetails] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          details,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const detailPlaceholder: Record<string, string> = {
    mpesa: "M-Pesa phone number (e.g. 254712345678)",
    bank_transfer: "Bank name, account number, account name",
    flutterwave: "Card number or mobile money handle",
    crypto_usdt: "USDT (TRC20) wallet address",
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Withdraw</h1>
        <p className="text-sm text-[#A0A0B0] mt-1">Request a withdrawal to your preferred method</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {methods.map((m) => {
          const Icon = m.icon
          const selected = method === m.id
          return (
            <button
              key={m.id}
              onClick={() => { setMethod(m.id); setResult(null); setError("") }}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected
                  ? "bg-[#D4A843]/10 border-[#D4A843]/40 text-[#D4A843]"
                  : "bg-[#1A1D29]/50 border-white/5 text-[#A0A0B0] hover:border-white/20"
              }`}
            >
              <Icon size={22} className="mb-2" />
              <div className="text-sm font-semibold text-[#F5F5F5]">{m.label}</div>
            </button>
          )
        })}
      </div>

      <Card className="p-6 max-w-xl">
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Withdrawal Details</label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={detailPlaceholder[method]}
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Processing..." : `Withdraw $${parseFloat(amount) || 0}`}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 text-center">
              <div className="text-lg font-bold text-[#00C853] mb-1">Withdrawal Submitted</div>
              <p className="text-sm text-[#A0A0B0]">{result.message}</p>
              <p className="text-xs text-[#D4A843] mt-2 font-mono">Ref: {result.reference}</p>
            </div>
            <button
              onClick={() => { setResult(null); setAmount(""); setDetails("") }}
              className="w-full py-3 rounded-xl bg-white/5 text-[#A0A0B0] text-sm font-medium hover:bg-white/10 transition"
            >
              Request Another Withdrawal
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
