"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Bitcoin, Loader2, CheckCircle, ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function WithdrawalPage() {
  const [amount, setAmount] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [kycLoading, setKycLoading] = useState(true)

  useEffect(() => {
    fetch("/api/kyc/status")
      .then((r) => r.json())
      .then((data) => setKycStatus(data.kyc_status))
      .catch(() => setKycStatus("pending"))
      .finally(() => setKycLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method: "crypto_usdt",
          details: walletAddress,
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Withdraw</h1>
        <p className="text-sm text-[#A0A0B0] mt-1">Withdraw USDT to your external wallet</p>
      </div>

      {!kycLoading && kycStatus !== "approved" && (
        <Card className="p-6 mb-8 border-[#D4A843]/30 bg-[#D4A843]/5">
          <div className="flex items-start gap-4">
            <ShieldAlert size={24} className="text-[#D4A843] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[#F5F5F5] mb-1">KYC Verification Required</h3>
              <p className="text-xs text-[#A0A0B0] mb-3">
                {kycStatus === "pending" || kycStatus === null
                  ? "You need to upload your KYC documents before you can withdraw funds."
                  : kycStatus === "submitted"
                  ? "Your KYC documents are under review. Withdrawals will be available once approved."
                  : "Your KYC was rejected. Please re-upload your documents."}
              </p>
              <Link
                href="/dashboard/mt-accounts"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4A843] text-[#0A0B0F] text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Go to KYC Upload
              </Link>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 max-w-xl">
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/20 mb-2">
              <Bitcoin size={22} className="text-[#D4A843]" />
              <div>
                <div className="text-sm font-semibold text-[#F5F5F5]">USDT (TRC20)</div>
                <div className="text-xs text-[#A0A0B0]">Withdraw to any USDT wallet</div>
              </div>
            </div>

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
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">USDT (TRC20) Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your USDT wallet address"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none"
                required
              />
              <p className="text-xs text-[#A0A0B0] mt-1">TRC20 network addresses only</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20 text-sm text-[#FF1744]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || kycStatus !== "approved"}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Withdraw ${parseFloat(amount) || 0}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <CheckCircle size={48} className="text-[#00C853] mx-auto" />
              <div className="text-lg font-bold text-[#00C853]">Withdrawal Submitted</div>
              <p className="text-sm text-[#A0A0B0]">{result.message}</p>
              <p className="text-xs text-[#D4A843] font-mono">Ref: {result.reference}</p>
            </div>
            <button
              onClick={() => { setResult(null); setAmount(""); setWalletAddress("") }}
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
