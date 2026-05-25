"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Check, X, ArrowDownLeft, ArrowUpRight, Search, TrendingUp } from "lucide-react"

type Transaction = {
  id: string
  user_id: string
  type: string
  method: string
  amount: number
  status: string
  reference: string
  created_at: string
  profiles: { email: string; first_name: string; last_name: string }
}

type Trade = {
  id: string
  user_id: string
  symbol: string
  type: string
  volume: number
  open_price: number
  close_price: number | null
  profit: number | null
  status: string
  opened_at: string
  closed_at: string | null
  created_at: string
  profiles: { email: string; first_name: string; last_name: string }
}

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"transactions" | "trades">("transactions")
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  async function fetchTxs() {
    try {
      const res = await fetch("/api/admin/transactions")
      const data = await res.json()
      setTxs(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function fetchTrades() {
    try {
      const res = await fetch("/api/admin/trades")
      const data = await res.json()
      setTrades(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => {
    Promise.all([fetchTxs(), fetchTrades()]).finally(() => setLoading(false))
  }, [])

  async function updateStatus(txId: string, status: string) {
    try {
      await fetch(`/api/admin/transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      fetchTxs()
    } catch {}
  }

  const filteredTx = txs.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = `${t.profiles?.first_name || ""} ${t.profiles?.last_name || ""}`.toLowerCase()
      const email = (t.profiles?.email || "").toLowerCase()
      const ref = (t.reference || "").toLowerCase()
      if (!name.includes(q) && !email.includes(q) && !ref.includes(q)) return false
    }
    return true
  })

  const filteredTrades = trades.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = `${t.profiles?.first_name || ""} ${t.profiles?.last_name || ""}`.toLowerCase()
      const symbol = (t.symbol || "").toLowerCase()
      if (!name.includes(q) && !symbol.includes(q)) return false
    }
    return true
  })

  const pendingTxs = txs.filter((t) => t.status === "pending")

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">
          {tab === "transactions"
            ? `Transactions ${pendingTxs.length > 0 ? `(${pendingTxs.length} pending)` : ""}`
            : "Trades"}
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              placeholder={`Search ${tab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-sm text-[#F5F5F5] w-56 focus:border-[#D4A843]/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab("transactions"); setFilter("all"); setSearch("") }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "transactions" ? "bg-[#D4A843]/15 text-[#D4A843]" : "bg-white/5 text-[#A0A0B0] hover:text-[#F5F5F5]"
          }`}
        >
          <ArrowDownLeft size={14} className="inline mr-1.5" />
          Transactions
        </button>
        <button
          onClick={() => { setTab("trades"); setFilter("all"); setSearch("") }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "trades" ? "bg-[#D4A843]/15 text-[#D4A843]" : "bg-white/5 text-[#A0A0B0] hover:text-[#F5F5F5]"
          }`}
        >
          <TrendingUp size={14} className="inline mr-1.5" />
          Trades ({trades.length})
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "pending", "completed", "failed", "cancelled", "open", "closed"].map((f) => {
          if (tab === "trades" && !["all", "open", "closed"].includes(f)) return null
          if (tab === "transactions" && ["open", "closed"].includes(f)) return null
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f ? "bg-[#D4A843]/15 text-[#D4A843]" : "bg-white/5 text-[#A0A0B0] hover:text-[#F5F5F5]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
        </div>
      ) : tab === "transactions" ? (
        <div className="space-y-3">
          {filteredTx.map((tx) => (
            <Card key={tx.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={tx.type === "deposit"
                    ? "w-10 h-10 rounded-lg bg-[#00C853]/10 flex items-center justify-center"
                    : "w-10 h-10 rounded-lg bg-[#FF1744]/10 flex items-center justify-center"
                  }>
                    {tx.type === "deposit" ? <ArrowDownLeft size={16} className="text-[#00C853]" /> : <ArrowUpRight size={16} className="text-[#FF1744]" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#F5F5F5] capitalize">{tx.type}</div>
                    <div className="text-xs text-[#A0A0B0]">
                      {tx.profiles?.first_name} {tx.profiles?.last_name} · {tx.profiles?.email}
                    </div>
                    <div className="text-xs text-[#A0A0B0]/60">
                      {tx.method?.replace(/_/g, " ")} · {tx.reference ? `Ref: ${tx.reference} · ` : ""}{new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={tx.type === "deposit" ? "text-sm font-semibold text-[#00C853]" : "text-sm font-semibold text-[#FF1744]"}>
                      {tx.type === "deposit" ? "+" : "-"}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs capitalize font-medium ${
                      tx.status === "completed" ? "text-[#00C853]" :
                      tx.status === "failed" || tx.status === "cancelled" ? "text-[#FF1744]" :
                      "text-[#D4A843]"
                    }`}>
                      {tx.status}
                    </div>
                  </div>
                  {tx.status === "pending" && tx.type === "withdrawal" && (
                    <div className="flex gap-1">
                      <button onClick={() => updateStatus(tx.id, "completed")} className="p-1.5 rounded-lg bg-[#00C853]/10 text-[#00C853] hover:bg-[#00C853]/20"><Check size={14} /></button>
                      <button onClick={() => updateStatus(tx.id, "cancelled")} className="p-1.5 rounded-lg bg-[#FF1744]/10 text-[#FF1744] hover:bg-[#FF1744]/20"><X size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {filteredTx.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[#A0A0B0]">{search ? "No transactions match your search" : "No transactions found"}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2196F3]/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-[#2196F3]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#F5F5F5]">
                      {t.symbol} <span className={t.type === "buy" ? "text-[#00C853]" : "text-[#FF1744]"}>{t.type.toUpperCase()}</span>
                      <span className="text-[#A0A0B0] font-normal"> · {t.volume} lot{t.volume !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-xs text-[#A0A0B0]">
                      {t.profiles?.first_name} {t.profiles?.last_name} · {t.profiles?.email}
                    </div>
                    <div className="text-xs text-[#A0A0B0]/60">
                      Open: ${Number(t.open_price).toFixed(5)}{t.close_price ? ` · Close: $${Number(t.close_price).toFixed(5)}` : ""} · {new Date(t.opened_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {t.profit !== null && (
                      <div className={`text-sm font-semibold ${Number(t.profit) >= 0 ? "text-[#00C853]" : "text-[#FF1744]"}`}>
                        {Number(t.profit) >= 0 ? "+" : ""}${Number(t.profit).toFixed(2)}
                      </div>
                    )}
                    <div className={`text-xs capitalize font-medium ${
                      t.status === "closed" ? "text-[#A0A0B0]" : "text-[#00C853]"
                    }`}>
                      {t.status}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {filteredTrades.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[#A0A0B0]">{search ? "No trades match your search" : "No trades placed yet"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
