"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Copy, CheckCircle, Upload, Loader2, Wallet, ExternalLink } from "lucide-react"
import QRCode from "qrcode"

const USDT_ADDRESS = "TXKfUAH9Yx6JmFE8wxxQXkbtBzzEXpxgSM"

export default function DepositPage() {
  const [amount, setAmount] = useState("")
  const [txHash, setTxHash] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    QRCode.toDataURL(USDT_ADDRESS, { width: 200, margin: 2 }).then(setQrDataUrl)
  }, [])

  function handleCopy() {
    navigator.clipboard.writeText(USDT_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const numAmount = parseFloat(amount)
      if (!numAmount || numAmount < 200) throw new Error("Minimum deposit is $200")
      if (!txHash.trim()) throw new Error("Transaction hash is required")

      let proofUrl = ""
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("/api/upload/proof", {
          method: "POST",
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error)
        proofUrl = uploadData.url
      }

      const res = await fetch("/api/deposits/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          tx_hash: txHash.trim(),
          proof_url: proofUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(true)
      try {
        const balRes = await fetch("/api/mt/accounts")
        const balData = await balRes.json()
        const list = Array.isArray(balData) ? balData : []
        const def = list.find((a: any) => a.is_default) || list[0]
        if (def) setCurrentBalance(def.balance)
      } catch {}
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
            <div className="text-lg font-bold text-[#00C853]">Deposit Submitted</div>
            <p className="text-sm text-[#A0A0B0]">
              Your deposit of ${parseFloat(amount).toFixed(2)} has been submitted for review.
              An admin will confirm it once the payment is verified on-chain.
            </p>
            {currentBalance != null && (
              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10">
                <p className="text-xs text-[#A0A0B0]">Current Account Balance</p>
                <p className="text-2xl font-bold text-[#00C853]">${currentBalance.toLocaleString()}</p>
              </div>
            )}
            <button
              onClick={() => { setSuccess(false); setAmount(""); setTxHash(""); setFile(null); setPreview(null) }}
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
        <p className="text-sm text-[#A0A0B0] mt-1">Fund your account via USDT (TRC-20)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 max-w-3xl">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <Wallet size={20} className="text-[#D4A843]" />
            Deposit Address
          </h2>

          <div className="space-y-4">
            <div className="flex justify-center">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="USDT Deposit Address QR" className="w-48 h-48" />
              )}
            </div>

            <div className="p-3 rounded-xl bg-[#0A0B0F] border border-white/10">
              <p className="text-xs text-[#A0A0B0] mb-1">Network: <span className="text-[#D4A843] font-medium">TRC-20 (Tron)</span></p>
              <p className="text-sm text-[#F5F5F5] break-all font-mono">{USDT_ADDRESS}</p>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {copied ? (
                <><CheckCircle size={16} /> Copied</>
              ) : (
                <><Copy size={16} /> Copy Address</>
              )}
            </button>

            <div className="p-3 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20">
              <p className="text-xs text-[#FF1744] font-medium">
                Only send USDT on TRC-20 network. Sending other tokens or on other networks may result in permanent loss.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-[#F5F5F5] mb-4">Submit Deposit</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Transaction Hash (TXID)</label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste your USDT transaction hash"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm font-mono focus:border-[#D4A843]/50 focus:outline-none"
                required
              />
              <p className="text-xs text-[#A0A0B0] mt-1">
                <ExternalLink size={12} className="inline mr-1" />
                Find this in your wallet under transaction history
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Screenshot Proof</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full h-32 rounded-xl bg-[#0A0B0F] border border-dashed border-white/10 hover:border-[#D4A843]/50 transition cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="Proof screenshot" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <Upload size={24} className="text-[#A0A0B0]" />
                    <span className="text-xs text-[#A0A0B0]">Click to upload screenshot</span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-[#A0A0B0] mt-1">Optional but recommended for faster verification</p>
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
              Submit Deposit
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
