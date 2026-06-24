"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Users, TrendingUp, DollarSign, BarChart3, Copy, ArrowUp, ArrowDown } from "lucide-react"

type Master = {
  id: string
  display_name: string
  bio: string | null
  total_trades: number
  win_rate: number | null
  total_pnl: number | null
  risk_level: string
  profiles: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

type Trade = {
  id: string
  symbol: string
  type: string
  volume: number
  open_price: number
  close_price: number | null
  profit: number | null
  status: string
  created_at: string
}

export default function MasterPublicPage() {
  const params = useParams()
  const [master, setMaster] = useState<Master | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [subs, setSubs] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/market/masters/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.master) {
          setMaster(data.master)
          setTrades(data.trades || [])
          setSubs(data.subscriber_count || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4A843] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!master) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center">
        <div className="text-center text-[#A0A0B0]">
          <h1 className="text-2xl font-bold text-[#F5F5F5] mb-2">Master Trader Not Found</h1>
          <p>The trader you're looking for doesn't exist or is no longer active.</p>
        </div>
      </div>
    )
  }

  const winRate = master.win_rate ?? 0
  const totalPnl = master.total_pnl ?? 0
  const openTrades = trades.filter((t) => t.status === "open").length

  return (
    <div className="min-h-screen bg-[#0A0B0F]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-3xl font-bold text-[#0A0B0F] shrink-0">
              {master.display_name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-[#F5F5F5]">{master.display_name}</h1>
              <p className="text-sm text-[#A0A0B0] mt-1">{master.profiles ? `${master.profiles.first_name || ""} ${master.profiles.last_name || ""}`.trim() : ""}</p>
              {master.bio && <p className="text-sm text-[#A0A0B0] mt-2 max-w-lg">{master.bio}</p>}
              <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-[#D4A843]" />
                  <span className="text-[#F5F5F5] font-semibold">{subs}</span>
                  <span className="text-[#A0A0B0]">followers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 size={16} className="text-[#D4A843]" />
                  <span className="text-[#F5F5F5] font-semibold">{winRate.toFixed(1)}%</span>
                  <span className="text-[#A0A0B0]">win rate</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={16} className={totalPnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]"} />
                  <span className={`font-semibold ${totalPnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]"}`}>
                    ${Math.abs(totalPnl).toLocaleString()}
                  </span>
                  <span className="text-[#A0A0B0]">P&L</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp size={16} className="text-[#D4A843]" />
                  <span className="text-[#F5F5F5] font-semibold">{master.total_trades}</span>
                  <span className="text-[#A0A0B0]">trades</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Copy size={18} className="text-[#D4A843]" />
            <h2 className="text-lg font-bold text-[#F5F5F5]">Trade History ({trades.length})</h2>
          </div>

          {trades.length === 0 ? (
            <p className="text-sm text-[#A0A0B0]">No trades yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#A0A0B0] border-b border-white/5">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Symbol</th>
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-right py-2 pr-4">Volume</th>
                    <th className="text-right py-2 pr-4">Open</th>
                    <th className="text-right py-2 pr-4">Close</th>
                    <th className="text-right py-2">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 text-[#F5F5F5]">
                      <td className="py-3 pr-4 text-[#A0A0B0] whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 font-medium">{t.symbol}</td>
                      <td className="py-3 pr-4">
                        <span className={`flex items-center gap-1 ${t.type === "buy" ? "text-[#00C853]" : "text-[#FF1744]"}`}>
                          {t.type === "buy" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">{t.volume}</td>
                      <td className="py-3 pr-4 text-right font-mono">{t.open_price}</td>
                      <td className="py-3 pr-4 text-right font-mono">{t.close_price || "-"}</td>
                      <td className={`py-3 text-right font-mono ${(t.profit ?? 0) >= 0 ? "text-[#00C853]" : "text-[#FF1744]"}`}>
                        {t.profit != null ? (t.profit >= 0 ? "+" : "") + t.profit.toFixed(2) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
