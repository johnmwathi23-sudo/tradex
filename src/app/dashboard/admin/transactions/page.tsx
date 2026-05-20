"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Check, X, ArrowDownLeft, ArrowUpRight } from "lucide-react"

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

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  async function fetchTxs() {
    try {
      const res = await fetch("/api/admin/transactions")
      const data = await res.json()
      setTxs(Array.isArray(data) ? data : [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTxs() }, [])

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

  const filtered = filter === "all" ? txs : txs.filter((t) => t.status === filter)
  const pendingTxs = txs.filter((t) => t.status === "pending")

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">
          Transactions {pendingTxs.length > 0 && <span className="text-sm text-[#D4A843]">({pendingTxs.length} pending)</span>}
        </h1>
        <div className="flex gap-2">
          {["all", "pending", "completed", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f ? "bg-[#D4A843]/15 text-[#D4A843]" : "bg-white/5 text-[#A0A0B0] hover:text-[#F5F5F5]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => (
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
                      {tx.profiles?.first_name} {tx.profiles?.last_name} · {tx.method.replace(/_/g, " ")} · {new Date(tx.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={tx.type === "deposit" ? "text-sm font-semibold text-[#00C853]" : "text-sm font-semibold text-[#FF1744]"}>
                      {tx.type === "deposit" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </div>
                    <div className={`text-xs capitalize ${tx.status === "completed" ? "text-[#00C853]" : tx.status === "failed" ? "text-[#FF1744]" : "text-[#D4A843]"}`}>
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
        </div>
      )}
    </div>
  )
}
