"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Trade = {
  id: string
  symbol: string
  type: "buy" | "sell"
  volume: number
  open_price: number
  current_price: number
  unrealized_pnl: number
  close_price: number | null
  profit: number | null
  status: string
  opened_at: string
  closed_at: string | null
}

export default function PortfolioPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/mt/orders")
      .then((r) => r.json())
      .then((data) => setTrades(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalPnl = trades.reduce((sum, t) => sum + (t.status === "open" ? (t.unrealized_pnl || 0) : (t.profit || 0)), 0)
  const openTrades = trades.filter((t) => t.status === "open")
  const closedTrades = trades.filter((t) => t.status === "closed")

  const groupBySymbol = trades.reduce<Record<string, Trade[]>>((acc, t) => {
    if (!acc[t.symbol]) acc[t.symbol] = []
    acc[t.symbol].push(t)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Portfolio</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-xs text-[#A0A0B0] mb-1">Total P&L</div>
          <div className={cn("text-2xl font-bold", totalPnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-[#A0A0B0] mb-1">Open Positions</div>
          <div className="text-2xl font-bold text-[#F5F5F5]">{openTrades.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-[#A0A0B0] mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-[#F5F5F5]">{trades.length}</div>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#F5F5F5]">Open Positions</h3>
        {loading ? (
          <div className="flex justify-center py-6 md:py-8">
            <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
          </div>
        ) : openTrades.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#A0A0B0]">No open positions</p>
            <p className="text-xs text-[#A0A0B0] mt-1">Place your first trade from the Trading Terminal</p>
          </Card>
        ) : (
          openTrades.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                    t.type === "buy" ? "bg-[#00C853]/10 text-[#00C853]" : "bg-[#FF1744]/10 text-[#FF1744]"
                  )}>
                    {t.type === "buy" ? "B" : "S"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#F5F5F5]">{t.symbol}</div>
                    <div className="text-xs text-[#A0A0B0]">{t.volume} lots @ {t.open_price}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-semibold", t.unrealized_pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                    {t.unrealized_pnl >= 0 ? "+" : ""}${t.unrealized_pnl?.toFixed(2) ?? "0.00"}
                  </div>
                  <div className="text-xs text-[#A0A0B0]">{new Date(t.opened_at).toLocaleDateString()}</div>
                </div>
              </div>
            </Card>
          ))
        )}

        {closedTrades.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-[#F5F5F5] mt-6">Closed Trades</h3>
            {closedTrades.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                      t.type === "buy" ? "bg-[#00C853]/10 text-[#00C853]" : "bg-[#FF1744]/10 text-[#FF1744]"
                    )}>
                      {t.type === "buy" ? "B" : "S"}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#F5F5F5]">{t.symbol}</div>
                      <div className="text-xs text-[#A0A0B0]">{t.volume} lots · {t.open_price} → {t.close_price}</div>
                    </div>
                  </div>
                  <div className={cn("text-sm font-semibold", (t.profit || 0) >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                    {(t.profit || 0) >= 0 ? "+" : ""}${(t.profit || 0).toFixed(2)}
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
