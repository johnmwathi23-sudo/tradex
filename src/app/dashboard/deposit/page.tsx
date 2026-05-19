"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Smartphone, CreditCard, Bitcoin, Building2, Copy, Check } from "lucide-react"

const methods = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone, desc: "Deposit via M-Pesa STK Push" },
  { id: "flutterwave", label: "Card / Mobile Money", icon: CreditCard, desc: "Visa, Mastercard, Airtel Money" },
  { id: "crypto", label: "Crypto", icon: Bitcoin, desc: "USDT (TRC20/ERC20), BTC" },
  { id: "bank", label: "Bank Transfer", icon: Building2, desc: "Wire transfer (USD)" },
]

const cryptoAssets = [
  { id: "USDT_TRC20", label: "USDT (TRC20)", network: "Tron" },
  { id: "USDT_ERC20", label: "USDT (ERC20)", network: "Ethereum" },
  { id: "BTC", label: "Bitcoin", network: "BTC" },
]

export default function DepositPage() {
  const [method, setMethod] = useState("mpesa")
  const [amount, setAmount] = useState("")
  const [phone, setPhone] = useState("")
  const [asset, setAsset] = useState("USDT_TRC20")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const body: any = { amount: parseFloat(amount) }
      let endpoint = ""

      switch (method) {
        case "mpesa":
          body.phone = phone
          endpoint = "/api/deposits/mpesa"
          break
        case "flutterwave":
          endpoint = "/api/deposits/flutterwave"
          break
        case "crypto":
          body.asset = asset
          endpoint = "/api/deposits/crypto"
          break
        case "bank":
          endpoint = "/api/deposits/bank"
          break
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  async function copyAddress(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Deposit</h1>
        <p className="text-sm text-[#A0A0B0] mt-1">Choose your preferred deposit method</p>
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
              <div className="text-xs mt-0.5">{m.desc}</div>
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

            {method === "mpesa" && (
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 254712345678"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none"
                  required
                />
                <p className="text-xs text-[#A0A0B0] mt-1">Enter phone number with country code (254...)</p>
              </div>
            )}

            {method === "crypto" && (
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Asset</label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none"
                >
                  {cryptoAssets.map((a) => (
                    <option key={a.id} value={a.id}>{a.label} ({a.network})</option>
                  ))}
                </select>
              </div>
            )}

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
              {loading ? "Processing..." : `Deposit $${parseFloat(amount) || 0}`}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 text-center">
              <div className="text-lg font-bold text-[#00C853] mb-1">Deposit Initiated</div>
              <p className="text-sm text-[#A0A0B0]">{result.message || result.instructions}</p>
            </div>

            {method === "crypto" && result.walletAddress && (
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Send to this {result.asset} address</label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0A0B0F] border border-white/10">
                  <code className="flex-1 text-xs text-[#F5F5F5] break-all font-mono">{result.walletAddress}</code>
                  <button
                    onClick={() => copyAddress(result.walletAddress)}
                    className="p-2 rounded-lg hover:bg-white/5 text-[#D4A843] shrink-0"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}

            {method === "bank" && result.bankDetails && (
              <div className="space-y-2 p-4 rounded-xl bg-[#0A0B0F] border border-white/10">
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">Bank</span><span className="text-[#F5F5F5]">{result.bankDetails.bankName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">Account Name</span><span className="text-[#F5F5F5]">{result.bankDetails.accountName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">Account Number</span><span className="text-[#F5F5F5] font-mono">{result.bankDetails.accountNumber}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">SWIFT</span><span className="text-[#F5F5F5] font-mono">{result.bankDetails.swiftCode}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">Reference</span><span className="text-[#D4A843] font-mono">{result.reference}</span></div>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setAmount(""); setPhone("") }}
              className="w-full py-3 rounded-xl bg-white/5 text-[#A0A0B0] text-sm font-medium hover:bg-white/10 transition"
            >
              Make Another Deposit
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
