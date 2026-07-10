"use client"

import { useEffect, useRef, useMemo } from "react"
import {
  createChart,
  ColorType,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import { Card } from "@/components/ui/card"
import {  Activity, BarChart3, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

type CopiedTrade = {
  id: string
  symbol: string
  type: string
  volume: number
  open_price: number
  close_price: number | null
  current_price: number
  profit: number | null
  unrealized_pnl: number
  status: string
  created_at: string
  master_name: string
  master_trade_id: string
  contract_size?: number
}

type PerformanceData = {
  equityCurve: { time: string; value: number }[]
  drawdownData: { time: string; value: number }[]
  stats: {
    totalReturn: number
    totalReturnPct: number
    maxDrawdown: number
    maxDrawdownPct: number
    sharpeRatio: number
    avgWin: number
    avgLoss: number
    profitFactor: number
    totalTrades: number
    winRate: number
  }
}

function computePerformanceData(trades: CopiedTrade[], initialBalance: number = 1000): PerformanceData {
  // Sort trades by created_at ascending
  const sorted = [...trades].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const equityCurve: { time: string; value: number }[] = []
  const drawdownData: { time: string; value: number }[] = []

  let equity = initialBalance
  let peak = initialBalance
  let maxDrawdown = 0
  let maxDrawdownPct = 0
  let wins = 0
  let losses = 0
  let totalWin = 0
  let totalLoss = 0

  // Start with initial balance point
  if (sorted.length > 0) {
    const firstDate = new Date(sorted[0].created_at)
    equityCurve.push({
      time: firstDate.toISOString().split("T")[0],
      value: equity,
    })
  }

  for (const trade of sorted) {
    const pnl = trade.status === "open" ? (trade.unrealized_pnl ?? 0) : (trade.profit ?? 0)
    equity += pnl

    // Track peak and drawdown
    if (equity > peak) peak = equity
    const drawdown = peak - equity
    const drawdownPct = peak > 0 ? (drawdown / peak) * 100 : 0

    if (drawdown > maxDrawdown) maxDrawdown = drawdown
    if (drawdownPct > maxDrawdownPct) maxDrawdownPct = drawdownPct

    // Track wins/losses
    if (trade.status !== "open") {
      if (pnl > 0) {
        wins++
        totalWin += pnl
      } else if (pnl < 0) {
        losses++
        totalLoss += Math.abs(pnl)
      }
    }

    const dateStr = new Date(trade.created_at).toISOString().split("T")[0]
    equityCurve.push({ time: dateStr, value: Number(equity.toFixed(2)) })
    drawdownData.push({ time: dateStr, value: -Number(drawdownPct.toFixed(2)) })
  }

  // Deduplicate by keeping last value per day
  const equityByDay = new Map<string, { time: string; value: number }>()
  for (const point of equityCurve) {
    equityByDay.set(point.time, point)
  }
  const uniqueEquity = Array.from(equityByDay.values())

  const ddByDay = new Map<string, { time: string; value: number }>()
  for (const point of drawdownData) {
    ddByDay.set(point.time, point)
  }
  const uniqueDD = Array.from(ddByDay.values())

  const totalReturn = equity - initialBalance
  const totalReturnPct = (totalReturn / initialBalance) * 100
  const closedTrades = wins + losses
  const avgWin = wins > 0 ? totalWin / wins : 0
  const avgLoss = losses > 0 ? totalLoss / losses : 0
  const profitFactor = totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Infinity : 0

  // Sharpe-like ratio (annualized based on actual time span)
  const returns = sorted
    .filter((t) => t.status !== "open")
    .map((t) => {
      const pnl = t.profit ?? 0
      return pnl / initialBalance
    })
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
  const stdReturn =
    returns.length > 1
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
      : 0
  // Calculate actual time span in days for annualization
  const timeSpanDays = sorted.length >= 2
    ? (new Date(sorted[sorted.length - 1].created_at).getTime() - new Date(sorted[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 1
  const tradesPerYear = timeSpanDays > 0 ? (365 / timeSpanDays) * returns.length : returns.length
  const annualizationFactor = Math.sqrt(Math.max(tradesPerYear, 1))
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * annualizationFactor : 0

  return {
    equityCurve: uniqueEquity,
    drawdownData: uniqueDD,
    stats: {
      totalReturn: Number(totalReturn.toFixed(2)),
      totalReturnPct: Number(totalReturnPct.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
      profitFactor: profitFactor === Infinity ? 999 : Number(profitFactor.toFixed(2)),
      totalTrades: closedTrades,
      winRate: closedTrades > 0 ? Number(((wins / closedTrades) * 100).toFixed(1)) : 0,
    },
  }
}

interface CopyTradingAnalyticsProps {
  trades: CopiedTrade[]
  initialBalance?: number
}

export default function CopyTradingAnalytics({ trades, initialBalance = 1000 }: CopyTradingAnalyticsProps) {
  const equityChartRef = useRef<HTMLDivElement>(null)
  const drawdownChartRef = useRef<HTMLDivElement>(null)
  const equityChartInstance = useRef<IChartApi | null>(null)
  const equitySeries = useRef<ISeriesApi<"Line"> | null>(null)
  const ddChartInstance = useRef<IChartApi | null>(null)
  const ddSeries = useRef<ISeriesApi<"Histogram"> | null>(null)

  const performanceData = useMemo(() => {
    if (trades.length === 0) return null
    return computePerformanceData(trades, initialBalance)
  }, [trades, initialBalance])

  // Initialize equity curve chart
  useEffect(() => {
    if (!equityChartRef.current || !performanceData || performanceData.equityCurve.length < 2) return

    const container = equityChartRef.current

    if (equityChartInstance.current) {
      equityChartInstance.current.remove()
      equityChartInstance.current = null
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#A0A0B0",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(212, 168, 67, 0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(212, 168, 67, 0.3)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.05)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.05)",
        timeVisible: false,
      },
    })

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#00C853",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: "#00C853",
      lastValueVisible: true,
      priceLineVisible: false,
    })

    lineSeries.setData(performanceData.equityCurve)
    chart.timeScale().fitContent()

    equityChartInstance.current = chart
    equitySeries.current = lineSeries

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width })
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      equityChartInstance.current = null
      equitySeries.current = null
    }
  }, [performanceData])

  // Initialize drawdown chart
  useEffect(() => {
    if (!drawdownChartRef.current || !performanceData || performanceData.drawdownData.length < 2) return

    const container = drawdownChartRef.current

    if (ddChartInstance.current) {
      ddChartInstance.current.remove()
      ddChartInstance.current = null
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 180,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#A0A0B0",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255, 23, 68, 0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(255, 23, 68, 0.3)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.05)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.05)",
        timeVisible: false,
      },
    })

    const histSeries = chart.addSeries(HistogramSeries, {
      priceLineVisible: false,
      lastValueVisible: false,
    })

    // Color bars based on severity
    const coloredData = performanceData.drawdownData.map((d) => ({
      ...d,
      color: d.value < -10 ? "rgba(255, 23, 68, 0.7)" : d.value < -5 ? "rgba(255, 23, 68, 0.4)" : "rgba(255, 23, 68, 0.2)",
    }))

    histSeries.setData(coloredData)
    chart.timeScale().fitContent()

    ddChartInstance.current = chart
    ddSeries.current = histSeries

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width })
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      ddChartInstance.current = null
      ddSeries.current = null
    }
  }, [performanceData])

  if (!performanceData || trades.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-[#D4A843]" />
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Performance Analytics</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity size={32} className="text-[#A0A0B0] mb-2 opacity-30" />
          <p className="text-sm text-[#A0A0B0]">No trade data available yet</p>
          <p className="text-xs text-[#A0A0B0]/60 mt-1">
            Start copying traders to see your performance analytics
          </p>
        </div>
      </Card>
    )
  }

  const { stats } = performanceData

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 size={18} className="text-[#D4A843]" />
        <h3 className="text-sm font-semibold text-[#F5F5F5]">Performance Analytics</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-[10px] text-[#A0A0B0] mb-1">Total Return</div>
          <div className={cn("text-lg font-bold", stats.totalReturn >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
            {stats.totalReturn >= 0 ? "+" : ""}${stats.totalReturn.toFixed(2)}
          </div>
          <div className={cn("text-[10px]", stats.totalReturnPct >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
            {stats.totalReturnPct >= 0 ? "+" : ""}{stats.totalReturnPct.toFixed(2)}%
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-[10px] text-[#A0A0B0] mb-1">Max Drawdown</div>
          <div className="text-lg font-bold text-[#FF1744]">
            -{stats.maxDrawdownPct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-[#A0A0B0]">
            -${stats.maxDrawdown.toFixed(2)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-[10px] text-[#A0A0B0] mb-1">Win Rate</div>
          <div className={cn("text-lg font-bold", stats.winRate >= 50 ? "text-[#00C853]" : "text-[#FF1744]")}>
            {stats.winRate}%
          </div>
          <div className="text-[10px] text-[#A0A0B0]">
            {stats.totalTrades} trades
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-[10px] text-[#A0A0B0] mb-1">Profit Factor</div>
          <div className={cn("text-lg font-bold", stats.profitFactor >= 1 ? "text-[#00C853]" : "text-[#FF1744]")}>
            {stats.profitFactor === 999 ? "∞" : stats.profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#A0A0B0]">
            Sharpe: {stats.sharpeRatio.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#00C853]/[0.05] border border-[#00C853]/10">
          <TrendingUp size={16} className="text-[#00C853] shrink-0" />
          <div>
            <div className="text-[10px] text-[#A0A0B0]">Avg Win</div>
            <div className="text-sm font-semibold text-[#00C853]">+${stats.avgWin.toFixed(2)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FF1744]/[0.05] border border-[#FF1744]/10">
          <TrendingDown size={16} className="text-[#FF1744] shrink-0" />
          <div>
            <div className="text-[10px] text-[#A0A0B0]">Avg Loss</div>
            <div className="text-sm font-semibold text-[#FF1744]">-${stats.avgLoss.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="mb-5">
        <div className="text-xs font-medium text-[#A0A0B0] mb-2">Equity Curve</div>
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
          <div ref={equityChartRef} className="w-full" />
        </div>
      </div>

      {/* Drawdown Chart */}
      <div>
        <div className="text-xs font-medium text-[#A0A0B0] mb-2">Drawdown</div>
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
          <div ref={drawdownChartRef} className="w-full" />
        </div>
      </div>
    </Card>
  )
}
