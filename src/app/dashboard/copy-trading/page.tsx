"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TrendingUp, Users, Star, Activity, Copy, Check } from "lucide-react"

type MasterTrader = {
  id: string
  display_name: string
  bio: string | null
  roi: number
  win_rate: number
  total_followers: number
  total_trades: number
  risk_level: string
  performance_fee: number
  min_investment: number
  is_verified: boolean
}

type Subscription = {
  id: string
  master_trader: MasterTrader
  allocation_percentage: number
  allocated_amount: number
  status: string
}

export default function CopyTradingPage() {
  const [masters, setMasters] = useState<MasterTrader[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch("/api/copy-trading/masters").then((r) => r.json()),
      fetch("/api/copy-trading/my-subscriptions").then((r) => r.json()),
    ]).then(([mastersData, subsData]) => {
      setMasters(Array.isArray(mastersData) ? mastersData : [])
      const subs = Array.isArray(subsData) ? subsData : []
      setSubscriptions(subs)
      setFollowing(new Set(subs.map((s: Subscription) => s.master_trader?.id)))
    }).finally(() => setLoading(false))
  }, [])

  async function handleFollow(masterId: string) {
    setFollowing((prev) => new Set(prev).add(masterId))
    await fetch("/api/copy-trading/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterTraderId: masterId, allocationPercentage: 10 }),
    })
    const res = await fetch("/api/copy-trading/my-subscriptions")
    const data = await res.json()
    setSubscriptions(Array.isArray(data) ? data : [])
  }

  async function handleUnfollow(subscriptionId: string, masterId: string) {
    await fetch(`/api/copy-trading/unfollow/${subscriptionId}`, { method: "POST" })
    setFollowing((prev) => {
      const next = new Set(prev)
      next.delete(masterId)
      return next
    })
    setSubscriptions((prev) => prev.filter((s) => s.id !== subscriptionId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4A843] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Copy Trading</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, value: masters.length.toString() + "+", label: "Master Traders" },
          { icon: Activity, value: subscriptions.length.toString(), label: "You Follow" },
          { icon: Star, value: masters.length > 0 ? `${Math.max(...masters.map(m => m.win_rate))}%` : "0%", label: "Top Win Rate" },
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

      {masters.length === 0 && (
        <Card className="p-12 text-center">
          <Copy size={40} className="text-[#A0A0B0] mx-auto mb-3" />
          <p className="text-lg font-medium text-[#F5F5F5]">No master traders yet</p>
          <p className="text-sm text-[#A0A0B0] mt-1">
            Master traders will appear here once they are added to the platform
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {masters.map((trader) => {
          const isFollowing = following.has(trader.id)
          const sub = subscriptions.find((s) => s.master_trader?.id === trader.id)

          return (
            <Card key={trader.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-[#0A0B0F] font-bold text-lg">
                    {trader.display_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#F5F5F5]">{trader.display_name}</h3>
                      {trader.is_verified && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20">Verified</span>
                      )}
                    </div>
                    {trader.bio && (
                      <p className="text-xs text-[#A0A0B0] mt-0.5">{trader.bio}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-[#A0A0B0] mt-1.5">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} className="text-[#00C853]" /> {trader.roi}% ROI
                      </span>
                      <span>{trader.win_rate}% win rate</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {trader.total_followers}</span>
                      <span>{trader.total_trades} trades</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-[#A0A0B0]">Risk</div>
                    <div className={cn(
                      "text-sm font-medium",
                      trader.risk_level === "low" && "text-[#00C853]",
                      trader.risk_level === "medium" && "text-[#D4A843]",
                      trader.risk_level === "high" && "text-[#FF1744]"
                    )}>
                      {trader.risk_level.charAt(0).toUpperCase() + trader.risk_level.slice(1)}
                    </div>
                  </div>
                  {isFollowing && sub ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnfollow(sub.id, trader.id)}
                    >
                      <Check size={14} className="mr-1 text-[#00C853]" />
                      Following
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => handleFollow(trader.id)}>
                      Copy
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
