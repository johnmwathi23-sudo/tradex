"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Copy } from "lucide-react"
import Link from "next/link"

type Account = {
  balance: number
  equity: number
  margin: number
  leverage: string
}

type Subscription = {
  id: string
  master_trader: { id: string; display_name: string; roi: number; risk_level: string }
  allocation_percentage: number
  allocated_amount: number
}

export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        if (data.account) setAccount(data.account)
      })
      .catch(() => {})

    fetch("/api/copy-trading/my-subscriptions")
      .then((r) => r.json())
      .then((data) => setSubscriptions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { icon: DollarSign, label: "Balance", value: account ? `$${Number(account.balance).toFixed(2)}` : "$0.00", change: account?.balance ? `Active` : "No funds", up: true },
    { icon: Activity, label: "Equity", value: account ? `$${Number(account.equity).toFixed(2)}` : "$0.00", change: account?.leverage || "1:100", up: true },
    { icon: TrendingUp, label: "Profit/Loss", value: "+$0.00", change: "No trades yet", up: true },
    { icon: Users, label: "Active Trades", value: "0", change: "No open positions", up: true },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Dashboard Overview</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center">
                <stat.icon size={18} className="text-[#D4A843]" />
              </div>
              <span className={cn(
                "text-xs font-medium flex items-center gap-1",
                stat.up ? "text-[#00C853]" : "text-[#FF1744]"
              )}>
                {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.change}
              </span>
            </div>
            <div className="text-lg font-bold text-[#F5F5F5]">{stat.value}</div>
            <div className="text-xs text-[#A0A0B0] mt-0.5">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#F5F5F5]">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/deposit"
              className="p-4 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 text-center hover:bg-[#00C853]/20 transition"
            >
              <div className="text-sm font-semibold text-[#00C853]">Deposit</div>
              <div className="text-xs text-[#A0A0B0] mt-1">Add funds</div>
            </Link>
            <Link
              href="/dashboard/withdrawal"
              className="p-4 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20 text-center hover:bg-[#FF1744]/20 transition"
            >
              <div className="text-sm font-semibold text-[#FF1744]">Withdraw</div>
              <div className="text-xs text-[#A0A0B0] mt-1">Request payout</div>
            </Link>
            <Link
              href="/dashboard/copy-trading"
              className="p-4 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/20 text-center hover:bg-[#D4A843]/20 transition"
            >
              <div className="text-sm font-semibold text-[#D4A843]">Copy Trading</div>
              <div className="text-xs text-[#A0A0B0] mt-1">Follow traders</div>
            </Link>
            <Link
              href="/dashboard/trading"
              className="p-4 rounded-xl bg-[#2196F3]/10 border border-[#2196F3]/20 text-center hover:bg-[#2196F3]/20 transition"
            >
              <div className="text-sm font-semibold text-[#2196F3]">Trade</div>
              <div className="text-xs text-[#A0A0B0] mt-1">Open positions</div>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Copy Trading</h3>
          {loading ? (
            <div className="flex justify-center py-6 md:py-8">
              <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Copy size={40} className="text-[#D4A843] mx-auto mb-3 opacity-50" />
              <p className="text-sm text-[#A0A0B0]">You are not following any traders yet</p>
              <Link
                href="/dashboard/copy-trading"
                className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#D4A843]/10 text-[#D4A843] text-sm font-medium hover:bg-[#D4A843]/20"
              >
                Browse Traders
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-[#0A0B0F] text-xs font-bold">
                      {sub.master_trader.display_name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#F5F5F5]">{sub.master_trader.display_name}</div>
                      <div className="text-xs text-[#A0A0B0]">{sub.allocation_percentage}% allocation</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#00C853]">+{sub.master_trader.roi}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
