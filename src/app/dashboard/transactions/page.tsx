"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, Repeat } from "lucide-react"

type Transaction = {
  id: string
  type: "deposit" | "withdrawal"
  method: string
  amount: number
  currency: string
  status: string
  reference: string
  description: string
  created_at: string
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((data) => setTxs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle size={12} className="text-[#00C853]" />
      case "failed": return <XCircle size={12} className="text-[#FF1744]" />
      default: return <Clock size={12} className="text-[#D4A843]" />
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Transactions</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/deposit"
            className="px-4 py-2 rounded-xl bg-[#00C853]/10 text-[#00C853] text-sm font-medium hover:bg-[#00C853]/20"
          >
            Deposit
          </Link>
          <Link
            href="/dashboard/withdrawal"
            className="px-4 py-2 rounded-xl bg-[#FF1744]/10 text-[#FF1744] text-sm font-medium hover:bg-[#FF1744]/20"
          >
            Withdraw
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
        </div>
      ) : txs.length === 0 ? (
        <div className="text-center py-16">
          <Repeat size={40} className="text-[#D4A843] mx-auto mb-3 opacity-50" />
          <p className="text-sm text-[#A0A0B0]">No transactions yet</p>
          <p className="text-xs text-[#A0A0B0] mt-1">Make your first deposit to get started</p>
          <Link
            href="/dashboard/deposit"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] text-sm font-semibold"
          >
            Deposit Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {txs.map((tx) => (
            <Card key={tx.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={tx.type === "deposit"
                    ? "w-10 h-10 rounded-lg bg-[#00C853]/10 flex items-center justify-center"
                    : "w-10 h-10 rounded-lg bg-[#FF1744]/10 flex items-center justify-center"
                  }>
                    {tx.type === "deposit" ? <ArrowDownLeft size={18} className="text-[#00C853]" /> : <ArrowUpRight size={18} className="text-[#FF1744]" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#F5F5F5] capitalize">{tx.type}</div>
                    <div className="text-xs text-[#A0A0B0]">{tx.method.replace(/_/g, " ")} · {new Date(tx.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={tx.type === "deposit" ? "text-sm font-semibold text-[#00C853]" : "text-sm font-semibold text-[#FF1744]"}>
                    {tx.type === "deposit" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 justify-end text-xs">
                    {statusIcon(tx.status)}
                    <span className="text-[#A0A0B0] capitalize">{tx.status}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
