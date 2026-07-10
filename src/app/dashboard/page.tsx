"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Copy, Timer, ZapOff } from "lucide-react"
import Link from "next/link"

const MIN_ACTIVE_DAYS = 5

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
  started_at: string
  status: string
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function calculateCopyPnL(startedAt: string, allocatedAmount: number) {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)
  const ratio = Math.min(elapsed / MIN_ACTIVE_DAYS, 1)
  const seed = new Date(startedAt).getTime()

  let pnlPercent: number
  if (ratio >= 1) {
    pnlPercent = -100
  } else if (ratio < 0.2) {
    const t = ratio / 0.2
    pnlPercent = seededRandom(seed) * 8 * t
  } else if (ratio < 0.4) {
    const t = (ratio - 0.2) / 0.2
    pnlPercent = 8 + seededRandom(seed + 1) * 7 * t
  } else if (ratio < 0.6) {
    const t = (ratio - 0.4) / 0.2
    pnlPercent = 15 - seededRandom(seed + 2) * 20 * t
  } else if (ratio < 0.8) {
    const t = (ratio - 0.6) / 0.2
    pnlPercent = -5 - seededRandom(seed + 3) * 25 * t
  } else {
    const t = (ratio - 0.8) / 0.2
    pnlPercent = -30 - seededRandom(seed + 4) * 50 * t
  }

  const pnl = (pnlPercent / 100) * allocatedAmount
  const remainingDays = Math.max(0, MIN_ACTIVE_DAYS - elapsed)
  const isBlown = ratio >= 1

  return { pnl, pnlPercent, remainingDays, elapsed, ratio, isBlown }
}

export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        const mt = data.mtAccounts?.find((a: { account_type: string }) => a.account_type === "real")
        if (mt) {
          setAccount({ balance: mt.balance, equity: mt.equity, margin: 0, leverage: mt.leverage })
        } else if (data.account) {
          setAccount(data.account)
        }
      })
      .catch(() => {})

    fetch("/api/copy-trading/my-subscriptions")
      .then((r) => r.json())
      .then((data) => setSubscriptions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalPnl = subscriptions.reduce((sum, sub) => {
    const { pnl } = calculateCopyPnL(sub.started_at, Number(sub.allocated_amount))
    return sum + pnl
  }, 0)

  const activeEntries = subscriptions.filter((s) => s.status === "active").length

  const stats = [
    { icon: DollarSign, label: "Balance", value: account ? `$${Number(account.balance).toFixed(2)}` : "$0.00", change: account?.balance ? `Active` : "No funds", up: true },
    { icon: Activity, label: "Equity", value: account ? `$${Number(account.equity).toFixed(2)}` : "$0.00", change: account?.leverage || "1:100", up: true },
    { icon: TrendingUp, label: "Copy Trading P&L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, change: `${activeEntries} active entr${activeEntries === 1 ? "y" : "ies"}`, up: totalPnl >= 0 },
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
              {subscriptions.map((sub) => {
                const { pnl, pnlPercent, remainingDays, ratio, isBlown } = calculateCopyPnL(sub.started_at, Number(sub.allocated_amount))
                return (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-[#0A0B0F] text-xs font-bold">
                        {sub.master_trader.display_name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#F5F5F5]">{sub.master_trader.display_name}</div>
                        <div className="text-xs text-[#A0A0B0]">{sub.allocation_percentage}% allocation</div>
                        {!isBlown ? (
                          <div className="flex items-center gap-1 text-[10px] text-[#D4A843] mt-0.5">
                            <Timer size={10} />
                            {Math.floor(remainingDays)}d {Math.floor((remainingDays % 1) * 24)}h left
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-[#FF1744] mt-0.5">
                            <ZapOff size={10} />
                            Blown
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-semibold", isBlown ? "text-[#FF1744]" : pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                        {isBlown ? "-100.0%" : `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%`}
                      </div>
                      <div className={cn("text-xs", pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                        ${pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
