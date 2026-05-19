"use client"

import { Card } from "@/components/ui/card"
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle } from "lucide-react"

const transactions = [
  { type: "deposit", method: "M-Pesa", amount: "+$500.00", date: "2024-05-18", status: "completed" },
  { type: "withdrawal", method: "Bank Transfer", amount: "-$200.00", date: "2024-05-17", status: "completed" },
  { type: "deposit", method: "USDT (TRC20)", amount: "+$1,000.00", date: "2024-05-16", status: "completed" },
  { type: "withdrawal", method: "M-Pesa", amount: "-$150.00", date: "2024-05-15", status: "pending" },
  { type: "deposit", method: "Visa Card", amount: "+$250.00", date: "2024-05-14", status: "completed" },
]

export default function TransactionsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Transactions</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-[#00C853]/10 text-[#00C853] text-sm font-medium hover:bg-[#00C853]/20">Deposit</button>
          <button className="px-4 py-2 rounded-xl bg-[#FF1744]/10 text-[#FF1744] text-sm font-medium hover:bg-[#FF1744]/20">Withdraw</button>
        </div>
      </div>

      <div className="space-y-3">
        {transactions.map((tx, i) => (
          <Card key={i} className="p-4">
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
                  <div className="text-xs text-[#A0A0B0]">{tx.method} · {tx.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={tx.type === "deposit" ? "text-sm font-semibold text-[#00C853]" : "text-sm font-semibold text-[#FF1744]"}>
                  {tx.amount}
                </div>
                <div className="flex items-center gap-1 justify-end text-xs">
                  {tx.status === "completed" ? <CheckCircle size={12} className="text-[#00C853]" /> : <Clock size={12} className="text-[#D4A843]" />}
                  <span className="text-[#A0A0B0] capitalize">{tx.status}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
