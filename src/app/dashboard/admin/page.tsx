"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Users, FileText, UserCheck, TrendingUp, Activity, DollarSign, Bot, Zap, Wallet, CheckCircle, XCircle, ExternalLink, Loader2, Save, RefreshCw, BarChart3, Send } from "lucide-react"
import dynamic from "next/dynamic"

const TradingViewChart = dynamic(() => import("@/components/tradingview-chart"), { ssr: false })

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

type MasterData = {
  id: string
  display_name: string
  bio: string | null
  roi: number
  win_rate: number
  total_trades: number
  total_pnl: number
  total_followers: number
  risk_level: string
  performance_fee: number
  min_investment: number
  default_stop_loss: number
  default_take_profit: number
  accounts: { id: string; balance: number; equity: number }[]
}

type OpenTrade = {
  id: string
  symbol: string
  type: "buy" | "sell"
  volume: number
  open_price: number
  stop_loss: number | null
  take_profit: number | null
  current_price: number
  unrealized_pnl: number
  created_at: string
}

const instruments = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", "EURGBP", "EURJPY", "GBPJPY", "XAUUSD", "XAGUSD", "USOIL", "BTCUSD", "ETHUSD", "SP500", "NAS100", "UK100"]

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [generating, setGenerating] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [result, setResult] = useState<string>("")
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [master, setMaster] = useState<MasterData | null>(null)
  const [masterForm, setMasterForm] = useState({
    balance: 0, equity: 0, win_rate: 0, total_trades: 0, roi: 0, total_pnl: 0,
    display_name: "", bio: "", risk_level: "medium",
    total_followers: 0, performance_fee: 0, min_investment: 0,
    default_stop_loss: 0, default_take_profit: 0,
  })
  const [savingMaster, setSavingMaster] = useState(false)
  const [masterMsg, setMasterMsg] = useState("")
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([])
  const [tradesLoading, setTradesLoading] = useState(false)
  const [editingSl, setEditingSl] = useState<Record<string, number | null>>({})
  const [editingTp, setEditingTp] = useState<Record<string, number | null>>({})
  const [savingTradeId, setSavingTradeId] = useState<string | null>(null)
  const [mtForm, setMtForm] = useState({ symbol: "EURUSD", type: "buy" as "buy" | "sell", volume: 0.1, stop_loss: "", take_profit: "" })
  const [executingManual, setExecutingManual] = useState(false)
  const [manualResult, setManualResult] = useState("")

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {})
    fetchSignals()
    fetchDeposits()
    fetchMaster()
    fetchOpenTrades()
  }, [])

  async function fetchMaster() {
    try {
      const res = await fetch("/api/admin/master-trader")
      const data = await res.json()
      if (data.master) {
        setMaster(data.master)
        setMasterForm({
          balance: data.master.accounts?.[0]?.balance || 0,
          equity: data.master.accounts?.[0]?.equity || 0,
          win_rate: data.master.win_rate || 0,
          total_trades: data.master.total_trades || 0,
          roi: data.master.roi || 0,
          total_pnl: data.master.total_pnl || 0,
          display_name: data.master.display_name || "",
          bio: data.master.bio || "",
          risk_level: data.master.risk_level || "medium",
          total_followers: data.master.total_followers || 0,
          performance_fee: data.master.performance_fee || 0,
          min_investment: data.master.min_investment || 0,
          default_stop_loss: data.master.default_stop_loss || 0,
          default_take_profit: data.master.default_take_profit || 0,
        })
      }
    } catch {}
  }

  async function fetchOpenTrades() {
    setTradesLoading(true)
    try {
      const res = await fetch("/api/admin/master-trader/trades")
      const data = await res.json()
      if (Array.isArray(data)) {
        setOpenTrades(data)
        const sl: Record<string, number | null> = {}
        const tp: Record<string, number | null> = {}
        data.forEach((t: OpenTrade) => {
          sl[t.id] = t.stop_loss
          tp[t.id] = t.take_profit
        })
        setEditingSl(sl)
        setEditingTp(tp)
      }
    } catch {}
    setTradesLoading(false)
  }

  async function saveTradeTpSl(tradeId: string) {
    setSavingTradeId(tradeId)
    try {
      const body: any = { trade_id: tradeId }
      if (editingSl[tradeId] !== undefined) body.stop_loss = editingSl[tradeId]
      if (editingTp[tradeId] !== undefined) body.take_profit = editingTp[tradeId]
      const res = await fetch("/api/admin/master-trader/trades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) fetchOpenTrades()
    } catch {}
    setSavingTradeId(null)
  }

  async function saveMaster() {
    setSavingMaster(true)
    setMasterMsg("")
    try {
      const res = await fetch("/api/admin/master-trader", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMasterMsg("Saved successfully")
      fetchMaster()
    } catch (err: any) {
      setMasterMsg("Error: " + err.message)
    } finally {
      setSavingMaster(false)
    }
  }

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

  async function executeManualTrade() {
    setExecutingManual(true)
    setManualResult("")
    try {
      const res = await fetch("/api/admin/master-trader/manual-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: mtForm.symbol,
          type: mtForm.type,
          volume: parseFloat(String(mtForm.volume)),
          stop_loss: mtForm.stop_loss ? parseFloat(mtForm.stop_loss) : null,
          take_profit: mtForm.take_profit ? parseFloat(mtForm.take_profit) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setManualResult(data.message)
      fetchOpenTrades()
    } catch (err: any) {
      setManualResult("Error: " + err.message)
    } finally {
      setExecutingManual(false)
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

      {master && (
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#0A0B0F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">My Master Trader Profile</h2>
              <p className="text-xs text-[#A0A0B0]">{master.display_name} • {master.total_followers} followers</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Balance ($)</label>
              <input type="number" value={masterForm.balance} onChange={(e) => setMasterForm({ ...masterForm, balance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Equity ($)</label>
              <input type="number" value={masterForm.equity} onChange={(e) => setMasterForm({ ...masterForm, equity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Win Rate (%)</label>
              <input type="number" value={masterForm.win_rate} onChange={(e) => setMasterForm({ ...masterForm, win_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Total Trades</label>
              <input type="number" value={masterForm.total_trades} onChange={(e) => setMasterForm({ ...masterForm, total_trades: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">ROI (%)</label>
              <input type="number" value={masterForm.roi} onChange={(e) => setMasterForm({ ...masterForm, roi: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Total P&L ($)</label>
              <input type="number" value={masterForm.total_pnl} onChange={(e) => setMasterForm({ ...masterForm, total_pnl: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Total Followers</label>
              <input type="number" value={masterForm.total_followers} onChange={(e) => setMasterForm({ ...masterForm, total_followers: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Performance Fee (%)</label>
              <input type="number" value={masterForm.performance_fee} onChange={(e) => setMasterForm({ ...masterForm, performance_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Min Investment ($)</label>
              <input type="number" value={masterForm.min_investment} onChange={(e) => setMasterForm({ ...masterForm, min_investment: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Risk Level</label>
              <select value={masterForm.risk_level} onChange={(e) => setMasterForm({ ...masterForm, risk_level: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Default Stop Loss</label>
              <input type="number" value={masterForm.default_stop_loss} onChange={(e) => setMasterForm({ ...masterForm, default_stop_loss: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Default Take Profit</label>
              <input type="number" value={masterForm.default_take_profit} onChange={(e) => setMasterForm({ ...masterForm, default_take_profit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-xs text-[#A0A0B0] block mb-1">Display Name</label>
              <input type="text" value={masterForm.display_name} onChange={(e) => setMasterForm({ ...masterForm, display_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-xs text-[#A0A0B0] block mb-1">Bio</label>
              <textarea value={masterForm.bio} onChange={(e) => setMasterForm({ ...masterForm, bio: e.target.value })} rows={3}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none resize-none" />
            </div>
          </div>

          {masterMsg && (
            <div className={`p-3 rounded-xl text-sm mb-4 ${masterMsg === "Saved successfully" ? "bg-[#00C853]/10 border border-[#00C853]/20 text-[#00C853]" : "bg-[#FF1744]/10 border border-[#FF1744]/20 text-[#FF1744]"}`}>
              {masterMsg}
            </div>
          )}

          <button onClick={saveMaster} disabled={savingMaster}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
            {savingMaster ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </Card>
      )}

      {master && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00C853]/20 flex items-center justify-center">
                <BarChart3 size={20} className="text-[#00C853]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5]">Open Trades — TP/SL Editor</h2>
                <p className="text-xs text-[#A0A0B0]">{openTrades.length} open positions</p>
              </div>
            </div>
            <button onClick={fetchOpenTrades} disabled={tradesLoading}
              className="p-2 rounded-lg bg-white/5 text-[#A0A0B0] hover:text-[#D4A843] hover:bg-[#D4A843]/10 transition disabled:opacity-50">
              <RefreshCw size={16} className={tradesLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {openTrades.length === 0 ? (
            <p className="text-sm text-[#A0A0B0]">No open trades</p>
          ) : (
            <div className="space-y-2">
              {openTrades.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-[#0A0B0F] border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-[#F5F5F5]">
                      {t.symbol} <span className={t.type === "buy" ? "text-[#00C853]" : "text-[#FF1744]"}>{t.type.toUpperCase()}</span>
                      <span className="text-[#A0A0B0] font-normal"> {t.volume} lots @ {t.open_price}</span>
                    </div>
                    <span className={`text-xs font-semibold ${t.unrealized_pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]"}`}>
                      {t.unrealized_pnl >= 0 ? "+" : ""}${t.unrealized_pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#A0A0B0] block mb-1">Stop Loss</label>
                      <input type="number" step="any" value={editingSl[t.id] ?? ""} onChange={(e) => setEditingSl({ ...editingSl, [t.id]: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-xs focus:border-[#D4A843]/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-[#A0A0B0] block mb-1">Take Profit</label>
                      <input type="number" step="any" value={editingTp[t.id] ?? ""} onChange={(e) => setEditingTp({ ...editingTp, [t.id]: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-xs focus:border-[#D4A843]/50 focus:outline-none" />
                    </div>
                  </div>
                  <button onClick={() => saveTradeTpSl(t.id)} disabled={savingTradeId === t.id}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-[#D4A843]/10 text-[#D4A843] text-xs font-medium hover:bg-[#D4A843]/20 transition disabled:opacity-50">
                    {savingTradeId === t.id ? "Saving..." : "Update TP/SL"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {master && (
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center">
              <Send size={20} className="text-[#0A0B0F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Manual Copy Trade</h2>
              <p className="text-xs text-[#A0A0B0]">Place a manual trade that will be copied to all your followers</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Instrument</label>
              <select value={mtForm.symbol} onChange={(e) => setMtForm({ ...mtForm, symbol: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none">
                {instruments.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Direction</label>
              <div className="flex gap-2">
                <button onClick={() => setMtForm({ ...mtForm, type: "buy" })}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition ${mtForm.type === "buy" ? "bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30" : "bg-[#0A0B0F] text-[#A0A0B0] border border-white/10"}`}>
                  BUY
                </button>
                <button onClick={() => setMtForm({ ...mtForm, type: "sell" })}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition ${mtForm.type === "sell" ? "bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/30" : "bg-[#0A0B0F] text-[#A0A0B0] border border-white/10"}`}>
                  SELL
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Volume (lots)</label>
              <input type="number" step="0.01" min="0.01" value={mtForm.volume} onChange={(e) => setMtForm({ ...mtForm, volume: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Stop Loss (optional)</label>
              <input type="number" step="any" value={mtForm.stop_loss} onChange={(e) => setMtForm({ ...mtForm, stop_loss: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" placeholder="e.g. 1.0800" />
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Take Profit (optional)</label>
              <input type="number" step="any" value={mtForm.take_profit} onChange={(e) => setMtForm({ ...mtForm, take_profit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none" placeholder="e.g. 1.0900" />
            </div>
          </div>

          {manualResult && (
            <div className={`p-3 rounded-xl text-sm mb-4 ${manualResult.startsWith("Error") ? "bg-[#FF1744]/10 border border-[#FF1744]/20 text-[#FF1744]" : "bg-[#00C853]/10 border border-[#00C853]/20 text-[#00C853]"}`}>
              {manualResult}
            </div>
          )}

          <button onClick={executeManualTrade} disabled={executingManual || !mtForm.volume}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
            {executingManual ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {executingManual ? "Executing..." : "Execute & Copy to Followers"}
          </button>
        </Card>
      )}

      <Card className="p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00C853] to-[#00E676] flex items-center justify-center">
            <BarChart3 size={20} className="text-[#0A0B0F]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F5]">Live Trading Chart</h2>
            <p className="text-xs text-[#A0A0B0]">Real-time prices via TradingView</p>
          </div>
        </div>
        <TradingViewChart height={500} />
      </Card>
    </div>
  )
}
