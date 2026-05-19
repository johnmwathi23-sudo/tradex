"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Activity, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Dashboard Overview</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: "Balance", value: "$12,450.00", change: "+5.2%", up: true },
          { icon: Activity, label: "Equity", value: "$12,890.00", change: "+3.8%", up: true },
          { icon: TrendingUp, label: "Profit/Loss", value: "+$890.00", change: "+7.6%", up: true },
          { icon: Users, label: "Active Trades", value: "3", change: "2 open", up: true },
        ].map((stat) => (
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
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Open Positions</h3>
          <div className="space-y-3">
            {[
              { pair: "EUR/USD", type: "Buy", lots: "0.5", profit: "+$45.20", open: true },
              { pair: "XAU/USD", type: "Sell", lots: "0.2", profit: "-$12.30", open: false },
              { pair: "BTC/USD", type: "Buy", lots: "0.1", profit: "+$128.00", open: true },
            ].map((trade) => (
              <div key={trade.pair} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm font-medium text-[#F5F5F5]">{trade.pair}</div>
                  <div className="text-xs text-[#A0A0B0]">{trade.type} · {trade.lots} lots</div>
                </div>
                <span className={cn(
                  "text-sm font-semibold",
                  trade.profit.startsWith("+") ? "text-[#00C853]" : "text-[#FF1744]"
                )}>
                  {trade.profit}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Copy Trading</h3>
          <div className="text-center py-8">
            <Users size={40} className="text-[#D4A843] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#A0A0B0]">You are not following any traders yet</p>
            <p className="text-xs text-[#A0A0B0] mt-1">Browse top performers and start copying</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
