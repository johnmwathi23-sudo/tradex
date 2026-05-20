"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Users, FileText, UserCheck, TrendingUp, Activity, DollarSign } from "lucide-react"

type Stats = {
  totalUsers: number
  pendingKyc: number
  pendingTransactions: number
  activeTraders: number
  completedDeposits: number
  completedWithdrawals: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

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
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
}
