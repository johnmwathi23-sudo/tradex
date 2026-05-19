"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Star, Activity } from "lucide-react"

const masterTraders = [
  {
    name: "AlphaTrader",
    roi: "+127.5%",
    winRate: "82%",
    followers: 1240,
    trades: 342,
    risk: "Low",
  },
  {
    name: "CryptoKing",
    roi: "+89.3%",
    winRate: "76%",
    followers: 892,
    trades: 521,
    risk: "Medium",
  },
  {
    name: "ForexMaster",
    roi: "+156.8%",
    winRate: "88%",
    followers: 2103,
    trades: 198,
    risk: "Low",
  },
]

export default function CopyTradingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Copy Trading</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, value: "50+", label: "Master Traders" },
          { icon: Activity, value: "$2.1M", label: "AUM" },
          { icon: Star, value: "12.4%", label: "Avg. Monthly Return" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center mx-auto mb-2">
              <stat.icon size={18} className="text-[#D4A843]" />
            </div>
            <div className="text-xl font-bold text-[#F5F5F5]">{stat.value}</div>
            <div className="text-xs text-[#A0A0B0]">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {masterTraders.map((trader) => (
          <Card key={trader.name} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#D4A843]/20 flex items-center justify-center text-[#D4A843] font-bold">
                  {trader.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F5F5F5]">{trader.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#A0A0B0] mt-1">
                    <span className="flex items-center gap-1"><TrendingUp size={12} /> {trader.roi}</span>
                    <span>{trader.winRate} win rate</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {trader.followers}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-[#A0A0B0]">Risk Level</div>
                  <div className="text-sm font-medium text-[#00C853]">{trader.risk}</div>
                </div>
                <Button variant="primary" size="sm">Copy</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
