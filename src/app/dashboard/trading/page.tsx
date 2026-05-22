"use client"

import { useEffect, useState, useCallback, Component } from "react"
import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import SimulatedChart from "@/components/simulated-chart"

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-[#A0A0B0] mb-4">Something went wrong loading the terminal</p>
          <Button variant="primary" onClick={() => this.setState({ error: null })}>
            Retry
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

type MtAccount = {
  id: string
  login_id: string
  platform: string
  account_type: string
  balance: number
  equity: number
  leverage: string
  is_default: boolean
}

type Instrument = {
  id: string
  symbol: string
  name: string
  category: string
  spread: number
  digits: number
}

type Trade = {
  id: string
  symbol: string
  type: "buy" | "sell"
  volume: number
  open_price: number
  current_price: number
  bid: number
  ask: number
  unrealized_pnl: number
  profit: number | null
  status: string
  opened_at: string
}

type Price = {
  symbol: string
  bid: number
  ask: number
  spread: number
  mid: number
  source: string
}

const categories = ["forex", "commodities", "indices", "crypto"]

export default function TradingPage() {
  const [accounts, setAccounts] = useState<MtAccount[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [openTrades, setOpenTrades] = useState<Trade[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedInstrument, setSelectedInstrument] = useState("EURUSD")
  const [activeCategory, setActiveCategory] = useState("forex")
  const [volume, setVolume] = useState("0.01")
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState("")
  const [closingId, setClosingId] = useState<string | null>(null)
  const [price, setPrice] = useState<Price | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`/api/mt/price?symbol=${selectedInstrument}`)
      const data = await res.json()
      if (data.bid) setPrice(data)
    } catch {}
  }, [selectedInstrument])

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch("/api/mt/orders")
      const data = await res.json()
      setOpenTrades((Array.isArray(data) ? data : []).filter((t: Trade) => t.status === "open"))
    } catch {}
  }, [])

  const refreshAll = useCallback(() => {
    fetchPrice()
    fetchTrades()
  }, [fetchPrice, fetchTrades])

  useEffect(() => {
    let cancelled = false

    fetch("/api/mt/accounts")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setAccounts(list)
        const def = list.find((a: MtAccount) => a.is_default)
        if (def) setSelectedAccount(def.id)
        else if (list.length > 0) setSelectedAccount(list[0].id)
      })
      .catch(() => {})

    fetch("/api/mt/instruments")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setInstruments(Array.isArray(data) ? data : [])
      })
      .catch(() => {})

    refreshAll()
    const interval = setInterval(refreshAll, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [refreshAll])

  useEffect(() => {
    setPrice(null)
    fetchPrice()
  }, [selectedInstrument, fetchPrice])

  const filteredInstruments = instruments.filter((i) => i.category === activeCategory)

  async function placeOrder() {
    if (!selectedAccount || !selectedInstrument || !volume) return
    setPlacing(true)
    setMessage("")
    try {
      const res = await fetch("/api/mt/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mt_account_id: selectedAccount, symbol: selectedInstrument, type: orderType, volume }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`Executed: ${orderType.toUpperCase()} ${selectedInstrument} ${volume} lots @ ${orderType === "buy" ? data.ask : data.bid}`)
      refreshAll()
      fetch("/api/mt/accounts").then((r) => r.json()).then((d) => setAccounts(Array.isArray(d) ? d : [])).catch(() => {})
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setPlacing(false)
    }
  }

  async function closeTrade(tradeId: string) {
    setClosingId(tradeId)
    try {
      const res = await fetch(`/api/mt/orders/${tradeId}/close`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`Closed ${data.profit >= 0 ? "+" : ""}$${data.profit.toFixed(2)}`)
      refreshAll()
      fetch("/api/mt/accounts").then((r) => r.json()).then((d) => setAccounts(Array.isArray(d) ? d : [])).catch(() => {})
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setClosingId(null)
    }
  }

  const entryPositions = openTrades.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    type: t.type,
    open_price: t.open_price,
    volume: t.volume,
  }))

  return (
    <ErrorBoundary>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Trading Terminal</h1>
        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-4 py-2 rounded-xl bg-[#1A1D29]/50 border border-white/10 text-[#F5F5F5] text-sm"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.platform.toUpperCase()} #{a.login_id} ({a.account_type}) - ${Number(a.balance).toFixed(2)}
                </option>
              ))}
            </select>
          )}
          <a href="/dashboard/mt-accounts" className="px-4 py-2 rounded-xl bg-white/5 text-[#A0A0B0] text-sm font-medium hover:bg-white/10">
            Accounts
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="h-[500px] bg-[#0A0B0F] relative">
            <SimulatedChart symbol={selectedInstrument} currentPrice={price?.mid ?? null} positions={entryPositions} />
            {price && (
              <div className="absolute top-3 left-3 z-20 bg-[#0A0B0F]/90 px-3 py-2 rounded-lg border border-white/10 select-none">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold font-mono text-[#F5F5F5]">{price.bid.toFixed(5)}</span>
                  <span className="text-xs text-[#A0A0B0]">/</span>
                  <span className="text-lg font-bold font-mono text-[#F5F5F5]">{price.ask.toFixed(5)}</span>
                </div>
                <div className="flex gap-3 text-xs text-[#A0A0B0] mt-0.5">
                  <span>Spread: <span className="text-[#D4A843] font-mono">{price.spread.toFixed(5)}</span></span>
                  <span className={price.source === "live" ? "text-[#00C853]" : "text-[#D4A843]"}>
                    {price.source === "live" ? "LIVE" : "REF"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/5">
            <div className="flex gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition",
                    activeCategory === cat ? "bg-[#D4A843]/15 text-[#D4A843]" : "text-[#A0A0B0] hover:text-[#F5F5F5] hover:bg-white/5"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {filteredInstruments.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstrument(inst.symbol)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition",
                    selectedInstrument === inst.symbol
                      ? "bg-[#2196F3]/15 text-[#2196F3] border border-[#2196F3]/30"
                      : "text-[#A0A0B0] hover:text-[#F5F5F5] bg-white/5"
                  )}
                >
                  {inst.symbol}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Quick Order</h3>
            {!selectedAccount ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#A0A0B0]">No MT4/MT5 account connected</p>
                <a href="/dashboard/mt-accounts" className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#D4A843]/10 text-[#D4A843] text-sm font-medium hover:bg-[#D4A843]/20">
                  Connect Account
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {price && (
                  <div className="flex justify-between text-sm font-mono px-1 py-1.5 rounded-lg bg-[#0A0B0F]">
                    <span className="text-[#00C853]">Bid {price.bid.toFixed(5)}</span>
                    <span className="text-[#A0A0B0]">|</span>
                    <span className="text-[#FF1744]">Ask {price.ask.toFixed(5)}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs text-[#A0A0B0] block mb-1">Instrument</label>
                  <select
                    value={selectedInstrument}
                    onChange={(e) => setSelectedInstrument(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                  >
                    {instruments.map((i) => (
                      <option key={i.id} value={i.symbol}>{i.symbol}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderType("buy")}
                    className={cn(
                      "px-3 py-3 rounded-lg text-sm font-semibold transition",
                      orderType === "buy"
                        ? "bg-[#00C853] text-white shadow-[0_0_12px_rgba(0,200,83,0.3)]"
                        : "bg-[#00C853]/15 text-[#00C853] hover:bg-[#00C853]/25"
                    )}
                  >
                    Buy {price ? price.ask.toFixed(5) : ""}
                  </button>
                  <button
                    onClick={() => setOrderType("sell")}
                    className={cn(
                      "px-3 py-3 rounded-lg text-sm font-semibold transition",
                      orderType === "sell"
                        ? "bg-[#FF1744] text-white shadow-[0_0_12px_rgba(255,23,68,0.3)]"
                        : "bg-[#FF1744]/15 text-[#FF1744] hover:bg-[#FF1744]/25"
                    )}
                  >
                    Sell {price ? price.bid.toFixed(5) : ""}
                  </button>
                </div>

                <div>
                  <label className="text-xs text-[#A0A0B0] block mb-1">Volume (Lots)</label>
                  <input
                    type="number"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    step="0.01" min="0.01" max="100"
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                  />
                </div>

                <Button variant="primary" className="w-full" onClick={placeOrder} disabled={placing || !price}>
                  {placing ? "Executing..." : `${orderType === "buy" ? "Buy" : "Sell"} ${selectedInstrument}`}
                </Button>

                {message && (
                  <div className={cn(
                    "p-2 rounded-lg text-xs text-center",
                    message.startsWith("Error") ? "bg-[#FF1744]/10 text-[#FF1744]" : "bg-[#00C853]/10 text-[#00C853]"
                  )}>
                    {message}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">
              Open Positions ({openTrades.length})
              <span className="text-xs text-[#A0A0B0] font-normal ml-2">updates every 3s</span>
            </h3>
            {openTrades.length === 0 ? (
              <p className="text-xs text-[#A0A0B0] text-center py-4">No open positions</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {openTrades.map((t) => (
                  <div key={t.id} className="p-2 rounded-lg bg-[#0A0B0F]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#F5F5F5]">{t.symbol}</span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          t.type === "buy" ? "bg-[#00C853]/20 text-[#00C853]" : "bg-[#FF1744]/20 text-[#FF1744]"
                        )}>
                          {t.type.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => closeTrade(t.id)}
                        disabled={closingId === t.id}
                        className="px-3 py-1 rounded-lg bg-[#FF1744]/15 text-[#FF1744] text-xs font-medium hover:bg-[#FF1744]/25 transition disabled:opacity-50"
                      >
                        {closingId === t.id ? "..." : "Close"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                      <span className="text-[#A0A0B0]">Entry: <span className="text-[#F5F5F5]">{t.open_price}</span></span>
                      <span className={cn(
                        "text-right font-semibold",
                        t.unrealized_pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]"
                      )}>
                        {t.unrealized_pnl >= 0 ? "+" : ""}${t.unrealized_pnl.toFixed(2)}
                      </span>
                      <span className="text-[#A0A0B0]">
                        Lots: <span className="text-[#F5F5F5]">{t.volume}</span>
                      </span>
                      <span className="text-right text-[#A0A0B0]">
                        {t.bid && t.ask ? `Mkt: ${((t.bid + t.ask) / 2).toFixed(5)}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}
