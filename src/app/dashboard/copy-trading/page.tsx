"use client"

import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input, Slider, Select, Toggle } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  TrendingUp, Users, Star, Activity, Copy,
  Search, ChevronDown, ChevronUp, Settings, Pause,
  Play, ArrowUpDown, AlertTriangle, X, Timer, ZapOff
} from "lucide-react"

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
  master_trader_id: string
  allocation_percentage: number
  allocated_amount: number
  auto_topup: boolean
  status: string
  started_at: string
}

type Trade = {
  id: string
  symbol: string
  type: string
  volume: number
  open_price: number
  current_price: number
  unrealized_pnl: number
  profit: number | null
  status: string
  created_at: string
}

type MasterDetail = MasterTrader & { recent_trades: Trade[] }

const RISK_COLORS = { low: "#00C853", medium: "#D4A843", high: "#FF1744" } as const
const MIN_ACTIVE_DAYS = 5

function getLockRemainingDays(startedAt: string): number {
  const daysActive = (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)
  return Math.ceil(MIN_ACTIVE_DAYS - daysActive)
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

function isLocked(startedAt: string): boolean {
  return getLockRemainingDays(startedAt) > 0
}

export default function CopyTradingPage() {
  const [masters, setMasters] = useState<MasterTrader[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("total_followers")
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")
  const [expandedMasterId, setExpandedMasterId] = useState<string | null>(null)
  const [expandedData, setExpandedData] = useState<MasterDetail | null>(null)
  const [expandingLoading, setExpandingLoading] = useState(false)

  const [showFollowDialog, setShowFollowDialog] = useState(false)
  const [followTarget, setFollowTarget] = useState<MasterTrader | null>(null)
  const [followForm, setFollowForm] = useState({ allocationPercentage: 75, allocatedAmount: 200, autoTopup: false })
  const [followLoading, setFollowLoading] = useState(false)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editTargetSub, setEditTargetSub] = useState<Subscription | null>(null)
  const [editForm, setEditForm] = useState({ allocation_percentage: 10, allocated_amount: 200, auto_topup: false })
  const [editLoading, setEditLoading] = useState(false)

  const [unfollowTarget, setUnfollowTarget] = useState<{ subId: string; name: string } | null>(null)
  const [unfollowLoading, setUnfollowLoading] = useState(false)
  const [pauseLoading, setPauseLoading] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const { showToast } = useToast()

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 3000)
    return () => clearInterval(interval)
  }, [])

  const subscribedIds = useMemo(
    () => new Set(subscriptions.map((s) => s.master_trader_id)),
    [subscriptions]
  )

  const subMap = useMemo(
    () => Object.fromEntries(subscriptions.map((s) => [s.master_trader_id, s])),
    [subscriptions]
  )

  useEffect(() => {
    Promise.all([
      fetch("/api/copy-trading/masters").then((r) => {
        if (!r.ok) throw new Error("Failed to load masters")
        return r.json()
      }),
      fetch("/api/copy-trading/my-subscriptions").then((r) => {
        if (!r.ok) throw new Error("Failed to load subscriptions")
        return r.json()
      }),
    ])
      .then(([mastersData, subsData]) => {
        setMasters(Array.isArray(mastersData) ? mastersData : [])
        const subs = Array.isArray(subsData) ? subsData : []
        setSubscriptions(subs)
      })
      .catch((err) => {
        showToast(err.message, "error")
      })
      .finally(() => setLoading(false))
  }, [showToast])

  const filteredMasters = useMemo(() => {
    let result = [...masters]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (m) =>
          m.display_name.toLowerCase().includes(q) ||
          (m.bio && m.bio.toLowerCase().includes(q))
      )
    }

    if (riskFilter !== "all") {
      result = result.filter((m) => m.risk_level === riskFilter)
    }

    result.sort((a, b) => {
      const aVal = a[sortBy as keyof MasterTrader] ?? 0
      const bVal = b[sortBy as keyof MasterTrader] ?? 0
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "desc" ? bVal - aVal : aVal - bVal
      }
      return 0
    })

    return result
  }, [masters, searchQuery, riskFilter, sortBy, sortDir])

  const topWinRate = useMemo(() => {
    if (masters.length === 0) return "0%"
    return `${Math.max(...masters.map((m) => m.win_rate))}%`
  }, [masters])

  function handleExpand(masterId: string) {
    if (expandingLoading) return
    if (expandedMasterId === masterId) {
      setExpandedMasterId(null)
      setExpandedData(null)
      return
    }
    setExpandedMasterId(masterId)
    setExpandedData(null)
    setExpandingLoading(true)
    fetch(`/api/copy-trading/masters/${masterId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load trader details")
        return r.json()
      })
      .then((data) => setExpandedData(data))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setExpandingLoading(false))
  }

  function openFollowDialog(trader: MasterTrader) {
    setFollowTarget(trader)
    const existing = subMap[trader.id]
    setFollowForm({
      allocationPercentage: existing?.allocation_percentage ?? 75,
      allocatedAmount: existing?.allocated_amount ?? 200,
      autoTopup: existing?.auto_topup ?? false,
    })
    setShowFollowDialog(true)
  }

  async function handleFollow() {
    if (!followTarget) return
    setFollowLoading(true)
    try {
      const res = await fetch("/api/copy-trading/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterTraderId: followTarget.id,
          allocationPercentage: followForm.allocationPercentage,
          allocatedAmount: followForm.allocatedAmount,
          autoTopup: followForm.autoTopup,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to follow")
      setSubscriptions((prev) => [...prev, data])
      setShowFollowDialog(false)
      showToast(`Entry created! Copying ${followTarget.display_name} — tracking live for 5 days`, "success")
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to follow", "error")
    } finally {
      setFollowLoading(false)
    }
  }

  async function handleUnfollow() {
    if (!unfollowTarget) return
    setUnfollowLoading(true)
    try {
      const res = await fetch(`/api/copy-trading/unfollow/${unfollowTarget.subId}`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to unfollow")
      }
      setSubscriptions((prev) => prev.filter((s) => s.id !== unfollowTarget.subId))
      setUnfollowTarget(null)
      showToast(`Stopped copying ${unfollowTarget.name}`, "info")
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to unfollow", "error")
    } finally {
      setUnfollowLoading(false)
    }
  }

  async function handlePauseToggle(sub: Subscription) {
    setPauseLoading(sub.id)
    const newStatus = sub.status === "active" ? "paused" : "active"
    try {
      const res = await fetch(`/api/copy-trading/subscriptions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? data : s)))
      showToast(
        newStatus === "paused"
          ? `Paused copy of ${sub.master_trader.display_name}`
          : `Resumed copy of ${sub.master_trader.display_name}`,
        "success"
      )
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error")
    } finally {
      setPauseLoading(null)
    }
  }

  function openEditDialog(sub: Subscription) {
    setEditTargetSub(sub)
    setEditForm({
      allocation_percentage: sub.allocation_percentage,
      allocated_amount: sub.allocated_amount,
      auto_topup: sub.auto_topup,
    })
    setShowEditDialog(true)
  }

  async function handleEdit() {
    if (!editTargetSub) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/copy-trading/subscriptions/${editTargetSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update")
      setSubscriptions((prev) => prev.map((s) => (s.id === editTargetSub.id ? data : s)))
      setShowEditDialog(false)
      showToast("Subscription updated", "success")
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error")
    } finally {
      setEditLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 md:py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4A843] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Copy Trading</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, value: `${masters.length}+`, label: "Master Traders", color: "#D4A843" },
          { icon: Activity, value: subscriptions.length.toString(), label: "You Follow", color: "#00C853" },
          { icon: Star, value: topWinRate, label: "Top Win Rate", color: "#D4A843" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div className="text-xl font-bold text-[#F5F5F5]">{stat.value}</div>
            <div className="text-xs text-[#A0A0B0]">{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search traders..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-sm text-[#F5F5F5] placeholder:text-[#A0A0B0]/60 focus:border-[#D4A843]/50 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {["all", "low", "medium", "high"].map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition border",
                  riskFilter === level
                    ? level === "all"
                      ? "bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/30"
                      : `bg-opacity-20 border-opacity-30`
                    : "bg-white/5 text-[#A0A0B0] border-transparent hover:bg-white/10"
                )}
                style={
                  riskFilter === level && level !== "all"
                    ? { backgroundColor: `${RISK_COLORS[level as keyof typeof RISK_COLORS]}20`, borderColor: `${RISK_COLORS[level as keyof typeof RISK_COLORS]}40`, color: RISK_COLORS[level as keyof typeof RISK_COLORS] }
                    : undefined
                }
              >
                {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-[140px] text-xs"
            >
              <option value="total_followers">Followers</option>
              <option value="roi">ROI</option>
              <option value="win_rate">Win Rate</option>
              <option value="total_trades">Trades</option>
            </Select>
            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="w-8 h-8 rounded-lg bg-[#0A0B0F] border border-white/10 flex items-center justify-center text-[#A0A0B0] hover:text-[#D4A843] transition"
              title={sortDir === "desc" ? "Descending" : "Ascending"}
            >
              <ArrowUpDown size={14} className={cn("transition", sortDir === "asc" && "rotate-180")} />
            </button>
          </div>
        </div>
      </Card>

      {filteredMasters.length === 0 && (
        <Card className="p-12 text-center">
          <Copy size={40} className="text-[#A0A0B0] mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium text-[#F5F5F5]">
            {searchQuery || riskFilter !== "all"
              ? "No traders match your filters"
              : "No master traders yet"}
          </p>
          <p className="text-sm text-[#A0A0B0] mt-1">
            {searchQuery || riskFilter !== "all"
              ? "Try adjusting your search or filter"
              : "Master traders will appear here once they are added to the platform"}
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {filteredMasters.map((trader, idx) => {
          const isFollowing = subscribedIds.has(trader.id)
          const sub = subMap[trader.id]

          return (
            <Card
              key={trader.id}
              className="p-5 hover:scale-[1.01] transition-transform duration-200 animate-fadeIn will-change-transform"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-[#0A0B0F] font-bold text-lg shrink-0">
                    {trader.display_name[0]}
                  </div>
                  <div className="min-w-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-[#F5F5F5]">{trader.display_name}</h3>
                      {trader.is_verified && <Badge variant="verified">Verified</Badge>}
                      {isFollowing && sub?.status === "paused" && <Badge variant="paused">Paused</Badge>}
                    </div>
                    {trader.bio && (
                      <p className="text-xs text-[#A0A0B0] mt-0.5 break-words">{trader.bio}</p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-[#A0A0B0] mt-1.5">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} className="text-[#00C853]" /> {trader.roi}% ROI
                      </span>
                      <span>{trader.win_rate}% win rate</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {trader.total_followers}</span>
                      <span>{trader.total_trades} trades</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 text-xs">
                      <Badge variant={trader.risk_level as keyof typeof RISK_COLORS}>
                        {trader.risk_level.charAt(0).toUpperCase() + trader.risk_level.slice(1)} Risk
                      </Badge>
                      <span className="text-[#A0A0B0]">Fee: {trader.performance_fee}%</span>
                      <span className="text-[#A0A0B0]">Min: ${trader.min_investment}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isFollowing && sub ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(sub)}
                        title="Adjust settings"
                        className="!p-2"
                      >
                        <Settings size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePauseToggle(sub)}
                        disabled={pauseLoading === sub.id || (sub.status === "active" && isLocked(sub.started_at))}
                        title={sub.status === "active" ? (isLocked(sub.started_at) ? `${getLockRemainingDays(sub.started_at)}d lock remaining` : "Pause") : "Resume"}
                        className="!p-2"
                      >
                        {pauseLoading === sub.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
                        ) : sub.status === "active" ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUnfollowTarget({ subId: sub.id, name: trader.display_name })
                        }
                        disabled={sub.status === "active" && isLocked(sub.started_at)}
                        className="border-[#FF1744]/30 text-[#FF1744] hover:bg-[#FF1744]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={sub.status === "active" && isLocked(sub.started_at) ? `${getLockRemainingDays(sub.started_at)}d lock remaining` : "Stop"}
                      >
                        <X size={14} className="mr-1" />
                        Stop
                      </Button>
                      <div className="text-right ml-1">
                        <div className="text-xs text-[#A0A0B0]">Allocation</div>
                        <div className="text-sm font-semibold text-[#D4A843]">
                          {sub.allocation_percentage}%
                        </div>
                      </div>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openFollowDialog(trader)}
                    >
                      <Copy size={14} className="mr-1" />
                      Copy
                    </Button>
                  )}
                  <button
                    onClick={() => handleExpand(trader.id)}
                    disabled={expandingLoading}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A0A0B0] hover:text-[#D4A843] hover:bg-white/5 transition-all duration-200 disabled:opacity-50"
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${expandedMasterId === trader.id ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {isFollowing && sub && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-x-4 gap-y-1.5 text-xs text-[#A0A0B0] flex-wrap">
                  <span>
                    Allocated: <strong className="text-[#F5F5F5]">${Number(sub.allocated_amount).toFixed(2)}</strong>
                  </span>
                  <span>
                    Auto Top-up:{" "}
                    <strong className={sub.auto_topup ? "text-[#00C853]" : "text-[#A0A0B0]"}>
                      {sub.auto_topup ? "On" : "Off"}
                    </strong>
                  </span>
                  {sub.status === "active" && isLocked(sub.started_at) && (
                    <span className="text-[#D4A843] font-medium">
                      Locked: {getLockRemainingDays(sub.started_at)}d remaining
                    </span>
                  )}
                  <Badge variant={sub.status as keyof typeof RISK_COLORS}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </Badge>
                </div>
              )}

              {isFollowing && sub && sub.status === "active" && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  {(() => {
                    const { pnl, pnlPercent, remainingDays, ratio, isBlown } = calculateCopyPnL(sub.started_at, Number(sub.allocated_amount))
                    return (
                      <div className="animate-fadeIn">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Timer size={14} className="text-[#D4A843]" />
                            <span className="text-xs text-[#A0A0B0]">
                              {isBlown ? "Entry Expired" : `${Math.floor(remainingDays)}d ${Math.floor((remainingDays % 1) * 24)}h remaining`}
                            </span>
                          </div>
                          <div className={cn("text-sm font-bold", isBlown ? "text-[#FF1744]" : pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                            {isBlown ? "-100.00%" : `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`}
                            <span className="text-xs ml-1 opacity-80">
                              {isBlown ? "($0.00)" : `($${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)})`}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", isBlown ? "bg-[#FF1744]" : pnl >= 0 ? "bg-[#00C853]" : "bg-[#FF1744]")}
                            style={{ width: isBlown ? "100%" : `${ratio * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#A0A0B0] mt-1">
                          <span>Entry Day 1</span>
                          <span>{isBlown ? "Blown" : "Day " + Math.min(Math.floor(ratio * 5) + 1, 5)}</span>
                          <span>Day 5</span>
                        </div>
                        {isBlown && (
                          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-[#FF1744]/10 border border-[#FF1744]/20">
                            <ZapOff size={14} className="text-[#FF1744] shrink-0" />
                            <span className="text-xs text-[#FF1744] font-medium">Account blown — all funds lost</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className={`expand-content ${expandedMasterId === trader.id ? "open" : ""}`}>
                <div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    {expandingLoading && expandedMasterId === trader.id ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin w-5 h-5 border-2 border-[#D4A843] border-t-transparent rounded-full" />
                      </div>
                    ) : expandedData && expandedMasterId === trader.id ? (
                      <div className="animate-fadeIn">
                        <h4 className="text-sm font-semibold text-[#F5F5F5] mb-3 flex items-center gap-2">
                          <Activity size={14} className="text-[#D4A843]" />
                          Recent Trades
                        </h4>
                        {expandedData.recent_trades.length === 0 ? (
                          <p className="text-xs text-[#A0A0B0] py-3 text-center">No recent trades</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[#A0A0B0] border-b border-white/5">
                                  <th className="text-left py-2 pr-3 font-medium">Symbol</th>
                                  <th className="text-left py-2 pr-3 font-medium">Type</th>
                                  <th className="text-right py-2 pr-3 font-medium">Vol</th>
                                  <th className="text-right py-2 pr-3 font-medium">Entry</th>
                                  <th className="text-right py-2 pr-3 font-medium">Current</th>
                                  <th className="text-right py-2 pr-3 font-medium">P&L</th>
                                  <th className="text-right py-2 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandedData.recent_trades.map((trade) => {
                                  const pnl = trade.status === "open" ? trade.unrealized_pnl : (trade.profit ?? 0)
                                  return (
                                  <tr key={trade.id} className="border-b border-white/5 last:border-0">
                                    <td className="py-2 pr-3 text-[#F5F5F5] font-medium">{trade.symbol}</td>
                                    <td className={cn("py-2 pr-3", trade.type === "buy" ? "text-[#00C853]" : "text-[#FF1744]")}>
                                      {trade.type.toUpperCase()}
                                    </td>
                                    <td className="py-2 pr-3 text-right text-[#F5F5F5]">{trade.volume}</td>
                                    <td className="py-2 pr-3 text-right text-[#F5F5F5]">${Number(trade.open_price).toFixed(5)}</td>
                                    <td className="py-2 pr-3 text-right text-[#F5F5F5]">${Number(trade.current_price ?? trade.open_price).toFixed(5)}</td>
                                    <td className={cn("py-2 pr-3 text-right", pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                                      {pnl != null ? `${pnl >= 0 ? "+" : ""}$${Number(pnl).toFixed(2)}` : "—"}
                                    </td>
                                    <td className="py-2 text-right">
                                      <Badge variant={trade.status === "open" ? "active" : "default"}>
                                        {trade.status}
                                      </Badge>
                                    </td>
                                  </tr>
                                )})}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Dialog open={showFollowDialog} onClose={() => !followLoading && setShowFollowDialog(false)} title="Copy Trader">
        {followTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-[#0A0B0F] font-bold">
                {followTarget.display_name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#F5F5F5]">{followTarget.display_name}</div>
                <div className="text-xs text-[#A0A0B0]">{followTarget.roi}% ROI · {followTarget.win_rate}% win rate</div>
              </div>
            </div>

            <Slider
              label="Allocation Percentage"
              value={followForm.allocationPercentage}
              onChange={(v) => setFollowForm({ ...followForm, allocationPercentage: v })}
              min={75}
              max={100}
            />

            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Allocated Amount ($)</label>
              <p className="text-xs text-[#A0A0B0] mb-2">Minimum: $200</p>
              <Input
                type="number"
                min={200}
                step={0.01}
                value={followForm.allocatedAmount || ""}
                onChange={(e) => setFollowForm({ ...followForm, allocatedAmount: Number(e.target.value) || 200 })}
                placeholder="200.00"
              />
            </div>

            <Toggle
              enabled={followForm.autoTopup}
              onChange={(v) => setFollowForm({ ...followForm, autoTopup: v })}
              label="Auto top-up when balance is low"
            />

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleFollow}
                disabled={followLoading}
                className="flex-1"
              >
                {followLoading ? (
                  <div className="w-4 h-4 border-2 border-[#0A0B0F] border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {followLoading ? "Copying..." : "Confirm"}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowFollowDialog(false)}
                disabled={followLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={showEditDialog} onClose={() => !editLoading && setShowEditDialog(false)} title="Adjust Settings">
        {editTargetSub && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-[#0A0B0F] font-bold">
                {editTargetSub.master_trader.display_name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#F5F5F5]">
                  {editTargetSub.master_trader.display_name}
                </div>
                <Badge variant={editTargetSub.status as keyof typeof RISK_COLORS}>
                  {editTargetSub.status.charAt(0).toUpperCase() + editTargetSub.status.slice(1)}
                </Badge>
              </div>
            </div>

            <Slider
              label="Allocation Percentage"
              value={editForm.allocation_percentage}
              onChange={(v) => setEditForm({ ...editForm, allocation_percentage: v })}
              min={75}
              max={100}
            />

            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Allocated Amount ($)</label>
              <p className="text-xs text-[#A0A0B0] mb-2">Minimum: $200</p>
              <Input
                type="number"
                min={200}
                step={0.01}
                value={editForm.allocated_amount || ""}
                onChange={(e) => setEditForm({ ...editForm, allocated_amount: Number(e.target.value) || 200 })}
                placeholder="200.00"
              />
            </div>

            <Toggle
              enabled={editForm.auto_topup}
              onChange={(v) => setEditForm({ ...editForm, auto_topup: v })}
              label="Auto top-up when balance is low"
            />

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleEdit}
                disabled={editLoading}
                className="flex-1"
              >
                {editLoading ? (
                  <div className="w-4 h-4 border-2 border-[#0A0B0F] border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowEditDialog(false)}
                disabled={editLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={!!unfollowTarget}
        onClose={() => !unfollowLoading && setUnfollowTarget(null)}
        title="Stop Copying"
      >
        {unfollowTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20">
              <AlertTriangle size={20} className="text-[#FF1744] shrink-0" />
              <p className="text-sm text-[#F5F5F5]">
                Are you sure you want to stop copying <strong>{unfollowTarget.name}</strong>?
                Existing copied trades will remain open but no new trades will be copied.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleUnfollow}
                disabled={unfollowLoading}
                className="flex-1 bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white hover:shadow-lg hover:shadow-[#FF1744]/30"
              >
                {unfollowLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {unfollowLoading ? "Stopping..." : "Yes, Stop Copying"}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setUnfollowTarget(null)}
                disabled={unfollowLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
