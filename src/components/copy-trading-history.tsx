"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ArrowUpDown, ArrowUp, ArrowDown, Filter,
  Clock, History, ChevronLeft, ChevronRight
} from "lucide-react"

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
}

type SortField = "created_at" | "symbol" | "profit" | "volume" | "master_name"
type SortDir = "asc" | "desc"
type PnlFilter = "all" | "profit" | "loss"

const ROWS_PER_PAGE = 15

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface CopyTradingHistoryProps {
  trades: CopiedTrade[]
}

export default function CopyTradingHistory({ trades }: CopyTradingHistoryProps) {
  const [symbolFilter, setSymbolFilter] = useState("")
  const [masterFilter, setMasterFilter] = useState("")
  const [pnlFilter, setPnlFilter] = useState<PnlFilter>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)

  // Get unique symbols and masters for filter dropdowns
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set(trades.map((t) => t.symbol))
    return Array.from(symbols).sort()
  }, [trades])

  const uniqueMasters = useMemo(() => {
    const masters = new Set(trades.map((t) => t.master_name))
    return Array.from(masters).sort()
  }, [trades])

  // Apply filters
  const filteredTrades = useMemo(() => {
    let result = [...trades]

    if (symbolFilter) {
      result = result.filter((t) => t.symbol === symbolFilter)
    }

    if (masterFilter) {
      result = result.filter((t) => t.master_name === masterFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (pnlFilter !== "all") {
      result = result.filter((t) => {
        const pnl = t.status === "open" ? (t.unrealized_pnl ?? 0) : (t.profit ?? 0)
        if (pnlFilter === "profit") return pnl > 0
        if (pnlFilter === "loss") return pnl < 0
        return pnl === 0
      })
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      result = result.filter((t) => new Date(t.created_at).getTime() >= from)
    }

    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000 // include full day
      result = result.filter((t) => new Date(t.created_at).getTime() <= to)
    }

    return result
  }, [trades, symbolFilter, masterFilter, pnlFilter, dateFrom, dateTo, statusFilter])

  // Sort
  const sortedTrades = useMemo(() => {
    const sorted = [...filteredTrades]
    sorted.sort((a, b) => {
      let aVal: string | number, bVal: string | number

      switch (sortField) {
        case "created_at":
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        case "symbol":
          aVal = a.symbol
          bVal = b.symbol
          return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string)
        case "master_name":
          aVal = a.master_name
          bVal = b.master_name
          return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string)
        case "profit":
          aVal = a.status === "open" ? (a.unrealized_pnl ?? 0) : (a.profit ?? 0)
          bVal = b.status === "open" ? (b.unrealized_pnl ?? 0) : (b.profit ?? 0)
          break
        case "volume":
          aVal = a.volume
          bVal = b.volume
          break
        default:
          return 0
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      return 0
    })
    return sorted
  }, [filteredTrades, sortField, sortDir])

  // Pagination
  const totalPages = Math.ceil(sortedTrades.length / ROWS_PER_PAGE)
  const paginatedTrades = sortedTrades.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  )

  // Reset page when filters change
  const resetPage = () => setPage(1)

  // Summary stats for filtered data
  const filteredStats = useMemo(() => {
    let totalPnl = 0
    let wins = 0
    let losses = 0
    for (const t of filteredTrades) {
      const pnl = t.status === "open" ? (t.unrealized_pnl ?? 0) : (t.profit ?? 0)
      totalPnl += pnl
      if (t.status !== "open") {
        if (pnl > 0) wins++
        else if (pnl < 0) losses++
      }
    }
    const closed = wins + losses
    return {
      total: filteredTrades.length,
      totalPnl: Number(totalPnl.toFixed(2)),
      winRate: closed > 0 ? Number(((wins / closed) * 100).toFixed(1)) : 0,
      wins,
      losses,
    }
  }, [filteredTrades])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir(field === "created_at" ? "desc" : "desc")
    }
    setPage(1)
  }

  function clearFilters() {
    setSymbolFilter("")
    setMasterFilter("")
    setPnlFilter("all")
    setDateFrom("")
    setDateTo("")
    setStatusFilter("all")
    setPage(1)
  }

  const hasActiveFilters = symbolFilter || masterFilter || pnlFilter !== "all" || dateFrom || dateTo || statusFilter !== "all"

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[#D4A843]" />
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Trade History</h3>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[#A0A0B0]">
            {filteredStats.total} trades
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[10px] text-[#D4A843] hover:text-[#E5C05A] transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Symbol Filter */}
        <select
          value={symbolFilter}
          onChange={(e) => { setSymbolFilter(e.target.value); resetPage() }}
          className="px-2.5 py-1.5 rounded-lg bg-[#0A0B0F] border border-white/10 text-xs text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none"
        >
          <option value="">All Symbols</option>
          {uniqueSymbols.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Master Filter */}
        <select
          value={masterFilter}
          onChange={(e) => { setMasterFilter(e.target.value); resetPage() }}
          className="px-2.5 py-1.5 rounded-lg bg-[#0A0B0F] border border-white/10 text-xs text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none"
        >
          <option value="">All Masters</option>
          {uniqueMasters.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); resetPage() }}
          className="px-2.5 py-1.5 rounded-lg bg-[#0A0B0F] border border-white/10 text-xs text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>

        {/* P&L Filter */}
        <div className="flex items-center gap-1">
          {(["all", "profit", "loss"] as PnlFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setPnlFilter(f); resetPage() }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition border",
                pnlFilter === f
                  ? f === "profit"
                    ? "bg-[#00C853]/10 text-[#00C853] border-[#00C853]/30"
                    : f === "loss"
                    ? "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/30"
                    : "bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/30"
                  : "bg-white/5 text-[#A0A0B0] border-transparent hover:bg-white/10"
              )}
            >
              {f === "all" ? "All" : f === "profit" ? "Profit" : "Loss"}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-[#A0A0B0]" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); resetPage() }}
            className="px-2 py-1.5 rounded-lg bg-[#0A0B0F] border border-white/10 text-[10px] text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none w-[110px]"
          />
          <span className="text-[10px] text-[#A0A0B0]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); resetPage() }}
            className="px-2 py-1.5 rounded-lg bg-[#0A0B0F] border border-white/10 text-[10px] text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none w-[110px]"
          />
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-4 mb-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-[10px]">
        <span className="text-[#A0A0B0]">
          Showing <strong className="text-[#F5F5F5]">{filteredStats.total}</strong> of {trades.length} trades
        </span>
        <span className={cn("font-semibold", filteredStats.totalPnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
          Total: {filteredStats.totalPnl >= 0 ? "+" : ""}${filteredStats.totalPnl.toFixed(2)}
        </span>
        <span className="text-[#A0A0B0]">
          Win Rate: <strong className="text-[#F5F5F5]">{filteredStats.winRate}%</strong>
        </span>
        <span className="text-[#00C853]">{filteredStats.wins}W</span>
        <span className="text-[#FF1744]">{filteredStats.losses}L</span>
      </div>

      {/* Table */}
      {sortedTrades.length === 0 ? (
        <div className="py-12 text-center">
          <Filter size={28} className="text-[#A0A0B0] mx-auto mb-2 opacity-30" />
          <p className="text-sm text-[#A0A0B0]">No trades match your filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#A0A0B0] border-b border-white/5">
                  <th className="text-left py-2 pr-2">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-[#D4A843] transition font-medium"
                    >
                      Date
                      <SortIcon active={sortField === "created_at"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left py-2 pr-2">
                    <button
                      onClick={() => handleSort("master_name")}
                      className="flex items-center gap-1 hover:text-[#D4A843] transition font-medium"
                    >
                      Master
                      <SortIcon active={sortField === "master_name"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left py-2 pr-2">
                    <button
                      onClick={() => handleSort("symbol")}
                      className="flex items-center gap-1 hover:text-[#D4A843] transition font-medium"
                    >
                      Symbol
                      <SortIcon active={sortField === "symbol"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left py-2 pr-2 font-medium">Side</th>
                  <th className="text-right py-2 pr-2">
                    <button
                      onClick={() => handleSort("volume")}
                      className="flex items-center gap-1 justify-end hover:text-[#D4A843] transition font-medium"
                    >
                      Volume
                      <SortIcon active={sortField === "volume"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-right py-2 pr-2 font-medium">Entry</th>
                  <th className="text-right py-2 pr-2 font-medium">Current</th>
                  <th className="text-right py-2 pr-2">
                    <button
                      onClick={() => handleSort("profit")}
                      className="flex items-center gap-1 justify-end hover:text-[#D4A843] transition font-medium"
                    >
                      P&L
                      <SortIcon active={sortField === "profit"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-right py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((trade) => {
                  const pnl = trade.status === "open" ? (trade.unrealized_pnl ?? 0) : (trade.profit ?? 0)
                  return (
                    <tr
                      key={trade.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition"
                    >
                      <td className="py-2.5 pr-2 text-[#A0A0B0] whitespace-nowrap">
                        {formatDate(trade.created_at)}
                      </td>
                      <td className="py-2.5 pr-2 text-[#D4A843] font-medium whitespace-nowrap">
                        {trade.master_name}
                      </td>
                      <td className="py-2.5 pr-2 text-[#F5F5F5] font-semibold whitespace-nowrap">
                        {trade.symbol}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                            trade.type === "buy"
                              ? "bg-[#00C853]/10 text-[#00C853]"
                              : "bg-[#FF1744]/10 text-[#FF1744]"
                          )}
                        >
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-right text-[#F5F5F5]">
                        {trade.volume}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-[#F5F5F5]">
                        ${Number(trade.open_price).toFixed(5)}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-[#F5F5F5]">
                        ${Number(trade.current_price ?? trade.open_price).toFixed(5)}
                      </td>
                      <td className={cn("py-2.5 pr-2 text-right font-semibold", pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                        {pnl !== null ? `${pnl >= 0 ? "+" : ""}$${Number(pnl).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge variant={trade.status === "open" ? "active" : "default"}>
                          {trade.status}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <span className="text-[10px] text-[#A0A0B0]">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#A0A0B0] hover:text-[#D4A843] hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const pageNum = start + i
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-medium transition",
                        pageNum === page
                          ? "bg-[#D4A843]/20 text-[#D4A843] border border-[#D4A843]/30"
                          : "text-[#A0A0B0] hover:text-[#D4A843] hover:bg-white/5"
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#A0A0B0] hover:text-[#D4A843] hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown size={10} className="opacity-30" />
  return dir === "asc" ? <ArrowUp size={10} className="text-[#D4A843]" /> : <ArrowDown size={10} className="text-[#D4A843]" />
}
