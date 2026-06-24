"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Users, FileText, UserCheck, TrendingUp, Activity, DollarSign, Bot, Zap, Wallet, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react"

type Stats = {
  totalUsers: number
  pendingKyc: number
  pendingTransactions: number
  activeTraders: number
  completedDeposits: number
  completedWithdrawals: number
}

type Signal = {
  id: string
  symbol: string
  direction: string
  confidence: number
  status: string
  rationale: string
  created_at: string
}

type Deposit = {
  id: string
  user_id: string
  amount: number
  status: string
  proof_url: string | null
  metadata: { tx_hash?: string } | null
  created_at: string
  profiles: { email: string; first_name: string; last_name: string } | null
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [generating, setGenerating] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [result, setResult] = useState<string>("")
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
    fetchSignals()
    fetchDeposits()
  }, [])

  async function fetchDeposits() {
    try {
      const res = await fetch("/api/admin/deposits/crypto")
      const data = await res.json()
      if (data.deposits) setDeposits(data.deposits)
    } catch {}
  }

  async function handleDeposit(id: string, action: "confirmed" | "rejected") {
    setProcessingId(id)
    try {
      await fetch(`/api/admin/deposits/crypto/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      fetchDeposits()
      fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {})
    } finally {
      setProcessingId(null)
    }
  }

  async function fetchSignals() {
    try {
      const res = await fetch("/api/ai-trading/signals")
      const data = await res.json()
      setSignals(Array.isArray(data) ? data.slice(0, 5) : [])
    } catch {}
  }

  async function generateSignal() {
    setGenerating(true)
    setResult("")
    try {
      const res = await fetch("/api/ai-trading/generate", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setResult(`Signal generated: ${data.signal.symbol} ${data.signal.direction} (${data.signal.confidence}% confidence)`)
        fetchSignals()
      } else {
        setResult(data.error || "Failed to generate signal")
      }
    } catch (err: any) {
      setResult(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function executeSignal(signalId: string) {
    setExecuting(signalId)
    setResult("")
    try {
      const res = await fetch(`/api/ai-trading/signals/${signalId}/execute`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setResult(`Trade opened! Copied to ${data.copiedTo} followers.`)
        fetchSignals()
      } else {
        setResult(data.error || "Failed to execute")
      }
    } catch (err: any) {
      setResult(err.message)
    } finally {
      setExecuting(null)
    }
  }

  const cards = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers ?? 0, href: "/dashboard/admin/users", color: "#2196F3" },
    { icon: UserCheck, label: "Pending KYC", value: stats?.pendingKyc ?? 0, href: "/dashboard/admin/users", color: "#D4A843" },
    { icon: FileText, label: "Pending Transactions", value: stats?.pendingTransactions ?? 0, href: "/dashboard/admin/transactions", color: "#FF1744" },
    { icon: TrendingUp, label: "Active Traders", value: stats?.activeTraders ?? 0, href: "/dashboard/admin/traders", color: "#00C853" },
    { icon: DollarSign, label: "Deposits", value: stats?.completedDeposits ?? 0, href: "/dashboard/admin/transactions", color: "#00C853" },
    { icon: Activity, label: "Withdrawals", value: stats?.completedWithdrawals ?? 0, href: "/dashboard/admin/transactions", color: "#FF1744" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Admin Panel</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.label} href={c.href}>
              <Card className="p-5 hover:border-[#D4A843]/30 transition cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}20` }}>
                    <Icon size={18} style={{ color: c.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#F5F5F5]">{c.value}</div>
                <div className="text-xs text-[#A0A0B0] mt-0.5">{c.label}</div>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center">
              <Bot size={20} className="text-[#0A0B0F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">AlphaTrader AI</h2>
              <p className="text-xs text-[#A0A0B0]">Gemini-powered market analysis • News-aware • Auto-execution</p>
            </div>
          </div>
          <button
            onClick={generateSignal}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            <Zap size={16} />
            {generating ? "Analyzing..." : "Generate Signal"}
          </button>
        </div>

        <p className="text-xs text-[#A0A0B0] mb-3">
          Auto-generates daily at 6:00 AM UTC via Vercel Cron. Manual generation also available.
        </p>

        {result && (
          <div className="p-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/20 text-sm text-[#D4A843] mb-4">
            {result}
          </div>
        )}

        {signals.length > 0 && (
          <div className="space-y-2">
            {signals.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0A0B0F] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    s.status === "executed" ? "bg-[#00C853]" :
                    s.status === "expired" ? "bg-[#A0A0B0]" :
                    s.status === "cancelled" ? "bg-[#FF1744]" :
                    "bg-[#D4A843]"
                  }`} />
                  <div>
                    <div className="text-sm font-semibold text-[#F5F5F5]">
                      {s.symbol} <span className={s.direction === "buy" ? "text-[#00C853]" : "text-[#FF1744]"}>
                        {s.direction.toUpperCase()}
                      </span>
                      <span className="text-[#A0A0B0] font-normal"> @ {s.confidence}%</span>
                    </div>
                    <div className="text-xs text-[#A0A0B0] mt-0.5 line-clamp-1">{s.rationale}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === "executed" ? "bg-[#00C853]/10 text-[#00C853]" :
                    s.status === "pending" ? "bg-[#D4A843]/10 text-[#D4A843]" :
                    "bg-[#A0A0B0]/10 text-[#A0A0B0]"
                  }`}>
                    {s.status}
                  </span>
                  {s.status === "pending" && (
                    <button
                      onClick={() => executeSignal(s.id)}
                      disabled={executing === s.id}
                      className="px-3 py-1.5 rounded-lg bg-[#D4A843]/10 text-[#D4A843] text-xs font-medium hover:bg-[#D4A843]/20 transition disabled:opacity-50"
                    >
                      {executing === s.id ? "..." : "Execute"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#D4A843]/20 flex items-center justify-center">
            <Wallet size={20} className="text-[#D4A843]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F5]">Pending Crypto Deposits</h2>
            <p className="text-xs text-[#A0A0B0]">{deposits.filter(d => d.status === "pending").length} awaiting confirmation</p>
          </div>
        </div>

        {deposits.filter(d => d.status === "pending").length === 0 ? (
          <p className="text-sm text-[#A0A0B0]">No pending deposits</p>
        ) : (
          <div className="space-y-2">
            {deposits.filter(d => d.status === "pending").map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0A0B0F] border border-white/5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#F5F5F5]">
                    ${d.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#A0A0B0]">
                    {d.profiles ? `${d.profiles.first_name || ""} ${d.profiles.last_name || ""}`.trim() || d.profiles.email : d.user_id}
                  </div>
                  {d.metadata?.tx_hash && (
                    <div className="text-xs text-[#A0A0B0] font-mono truncate max-w-[200px]">
                      TX: {d.metadata.tx_hash}
                    </div>
                  )}
                  <div className="text-xs text-[#A0A0B0]">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {d.proof_url && (
                    <a
                      href={d.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 text-[#A0A0B0] hover:text-[#D4A843] hover:bg-[#D4A843]/10 transition"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeposit(d.id, "confirmed")}
                    disabled={processingId === d.id}
                    className="p-2 rounded-lg bg-[#00C853]/10 text-[#00C853] hover:bg-[#00C853]/20 transition disabled:opacity-50"
                  >
                    {processingId === d.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  </button>
                  <button
                    onClick={() => handleDeposit(d.id, "rejected")}
                    disabled={processingId === d.id}
                    className="p-2 rounded-lg bg-[#FF1744]/10 text-[#FF1744] hover:bg-[#FF1744]/20 transition disabled:opacity-50"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
