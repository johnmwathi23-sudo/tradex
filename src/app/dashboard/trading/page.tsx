"use client"

import { useEffect, useState, useCallback, useRef, Component } from "react"
import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
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
        <div className="flex flex-col items-center justify-center py-10 md:py-20">
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
  duration: number
  close_time: string
  age_minutes: number
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

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00"
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function TradingPage() {
  const [accounts, setAccounts] = useState<MtAccount[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [openTrades, setOpenTrades] = useState<Trade[]>([])
  const [closedTrades, setClosedTrades] = useState<Trade[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedInstrument, setSelectedInstrument] = useState("XAUUSD")
  const [activeCategory, setActiveCategory] = useState("forex")
  const [volume, setVolume] = useState("0.5")
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [tradeDuration, setTradeDuration] = useState(5)
  const [stopLoss, setStopLoss] = useState("")
  const [takeProfit, setTakeProfit] = useState("")
  const [placing, setPlacing] = useState(false)
  const [closing, setClosing] = useState<string | null>(null)
  const [price, setPrice] = useState<Price | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [showConfirmOrder, setShowConfirmOrder] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const cancelledRef = useRef(false)
  const { showToast } = useToast()

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`/api/mt/price?symbol=${selectedInstrument}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.bid) setPrice(data)
    } catch {
      /* ignore price fetch errors */
    }
  }, [selectedInstrument])

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch("/api/mt/orders")
      if (!res.ok) return
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setOpenTrades(list.filter((t: Trade) => t.status === "open"))
      setClosedTrades(list.filter((t: Trade) => t.status === "closed"))
    } catch {
      /* ignore trade fetch errors */
    }
  }, [])

  const refreshAll = useCallback(() => {
    fetchPrice()
    fetchTrades()
  }, [fetchPrice, fetchTrades])

  useEffect(() => {
    cancelledRef.current = false

    fetch("/api/mt/accounts")
      .then((r) => r.json())
      .then((data) => {
        if (cancelledRef.current) return
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
        if (!cancelledRef.current) setInstruments(Array.isArray(data) ? data : [])
      })
      .catch(() => {})

    refreshAll()
    const interval = setInterval(refreshAll, 3000)
    return () => {
      cancelledRef.current = true
      clearInterval(interval)
    }
  }, [refreshAll])

  useEffect(() => {
    setPrice(null)
    fetchPrice()
  }, [selectedInstrument, fetchPrice])

  const filteredInstruments = instruments.filter((i) => i.category === activeCategory)

  const selectedAccountData = accounts.find((a) => a.id === selectedAccount)

  function handlePlaceOrder() {
    if (!selectedAccount || !selectedInstrument || !volume) return
    setShowConfirmOrder(true)
  }

  async function confirmOrder() {
    if (!selectedAccount || !selectedInstrument || !volume) return
    setPlacing(true)
    setShowConfirmOrder(false)
    try {
      const res = await fetch("/api/mt/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mt_account_id: selectedAccount,
          symbol: selectedInstrument,
          type: orderType,
          volume,
          duration: tradeDuration,
          stop_loss: stopLoss || null,
          take_profit: takeProfit || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Executed: ${orderType.toUpperCase()} ${selectedInstrument} ${volume} lots`, "success")
      refreshAll()
      const accRes = await fetch("/api/mt/accounts")
      const accData = await accRes.json()
      if (Array.isArray(accData)) setAccounts(accData)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to place order", "error")
    } finally {
      setPlacing(false)
      setStopLoss("")
      setTakeProfit("")
    }
  }

  async function confirmClose(tradeId: string) {
    setClosing(tradeId)
    setShowConfirmClose(null)
    try {
      const res = await fetch(`/api/mt/orders/${tradeId}/close`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const pnl = data.profit ?? 0
      showToast(`Closed ${pnl >= 0 ? "+" : ""}$${Number(pnl).toFixed(2)}`, pnl >= 0 ? "success" : "info")
      refreshAll()
      const accRes = await fetch("/api/mt/accounts")
      const accData = await accRes.json()
      if (Array.isArray(accData)) setAccounts(accData)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to close trade", "error")
    } finally {
      setClosing(null)
    }
  }

  const entryPositions = openTrades.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    type: t.type,
    open_price: t.open_price,
    volume: t.volume,
  }))

  const totalUnrealizedPnL = openTrades.reduce((sum, t) => sum + (t.unrealized_pnl || 0), 0)

  return (
    <ErrorBoundary>
    <div className="max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5]">Trading Terminal</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {accounts.length > 0 && (
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-[#1A1D29]/50 border border-white/10 text-[#F5F5F5] text-sm min-w-0 max-w-full truncate"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.platform.toUpperCase()} #{a.login_id} ({a.account_type}) - ${Number(a.balance).toFixed(2)}
                </option>
              ))}
            </select>
          )}
          <a href="/dashboard/mt-accounts" className="shrink-0 px-3 py-2 rounded-xl bg-white/5 text-[#A0A0B0] text-sm font-medium hover:bg-white/10">
            Accounts
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="h-[280px] sm:h-[400px] lg:h-[500px] bg-[#0A0B0F] relative">
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
                  <span className="text-[#00C853]">LIVE</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-2 sm:p-3 border-t border-white/5">
            <div className="flex gap-1 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition",
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
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition",
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
          <Card className="p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Quick Order</h3>
            {!selectedAccount ? (
              <div className="text-center py-6 md:py-8">
                <p className="text-sm text-[#A0A0B0]">No trading account connected</p>
                <a href="/dashboard/mt-accounts" className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#D4A843]/10 text-[#D4A843] text-sm font-medium hover:bg-[#D4A843]/20">
                  Connect Account
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedAccountData && (
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#0A0B0F] text-xs">
                    <span className="text-[#A0A0B0]">Balance</span>
                    <span className="text-[#F5F5F5] font-semibold">${Number(selectedAccountData.balance).toFixed(2)}</span>
                    <span className="text-[#A0A0B0]">Equity</span>
                    <span className={cn("font-semibold", selectedAccountData.equity >= selectedAccountData.balance ? "text-[#00C853]" : "text-[#FF1744]")}>
                      ${Number(selectedAccountData.equity).toFixed(2)}
                    </span>
                  </div>
                )}

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
                  <Input
                    type="number"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    step="0.1" min="0.5" max="100"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#A0A0B0] block mb-1">Duration</label>
                  <select
                    value={tradeDuration}
                    onChange={(e) => setTradeDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                  >
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#A0A0B0] block mb-1">
                    Stop Loss <span className="text-[#A0A0B0]/50">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder={orderType === "buy" ? "Below current price" : "Above current price"}
                    step="0.00001"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#A0A0B0] block mb-1">
                    Take Profit <span className="text-[#A0A0B0]/50">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder={orderType === "buy" ? "Above current price" : "Below current price"}
                    step="0.00001"
                  />
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handlePlaceOrder}
                  disabled={placing || !price}
                >
                  {placing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#0A0B0F] border-t-transparent rounded-full animate-spin" />
                      Executing...
                    </span>
                  ) : (
                    `${orderType === "buy" ? "Buy" : "Sell"} ${selectedInstrument}`
                  )}
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#F5F5F5]">Positions</h3>
                <Badge variant={openTrades.length > 0 ? "active" : "default"}>
                  {openTrades.length}
                </Badge>
                {totalUnrealizedPnL !== 0 && (
                  <span className={cn("text-xs font-semibold", totalUnrealizedPnL >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                    {totalUnrealizedPnL >= 0 ? "+" : ""}${totalUnrealizedPnL.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowHistory(false)}
                  className={cn("px-2 py-1 rounded-lg text-xs font-medium transition", !showHistory ? "bg-[#D4A843]/15 text-[#D4A843]" : "text-[#A0A0B0] hover:text-[#F5F5F5]")}
                >
                  Open
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className={cn("px-2 py-1 rounded-lg text-xs font-medium transition", showHistory ? "bg-[#D4A843]/15 text-[#D4A843]" : "text-[#A0A0B0] hover:text-[#F5F5F5]")}
                >
                  History
                </button>
              </div>
            </div>

            {showHistory ? (
              closedTrades.length === 0 ? (
                <p className="text-xs text-[#A0A0B0] text-center py-3 md:py-4">No closed trades</p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {closedTrades.map((t) => (
                    <div key={t.id} className="p-2 rounded-lg bg-[#0A0B0F]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#F5F5F5]">{t.symbol}</span>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", t.type === "buy" ? "bg-[#00C853]/20 text-[#00C853]" : "bg-[#FF1744]/20 text-[#FF1744]")}>
                            {t.type.toUpperCase()}
                          </span>
                        </div>
                        <span className={cn("text-xs font-semibold", (t.profit ?? 0) >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                          {(t.profit ?? 0) >= 0 ? "+" : ""}${(t.profit ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                        <span className="text-[#A0A0B0]">Entry: <span className="text-[#F5F5F5]">{t.open_price}</span></span>
                        <span className="text-right text-[#A0A0B0]">Vol: <span className="text-[#F5F5F5]">{t.volume}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : openTrades.length === 0 ? (
              <p className="text-xs text-[#A0A0B0] text-center py-3 md:py-4">No open positions</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {openTrades.map((t) => {
                  const remaining = t.close_time ? new Date(t.close_time).getTime() - now : 0
                  return (
                    <div key={t.id} className="p-2 rounded-lg bg-[#0A0B0F]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#F5F5F5]">{t.symbol}</span>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", t.type === "buy" ? "bg-[#00C853]/20 text-[#00C853]" : "bg-[#FF1744]/20 text-[#FF1744]")}>
                            {t.type.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowConfirmClose(t.id)}
                          disabled={closing === t.id}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-medium transition disabled:opacity-50",
                            "bg-[#FF1744]/15 text-[#FF1744] hover:bg-[#FF1744]/25"
                          )}
                        >
                          {closing === t.id ? (
                            <div className="w-3 h-3 border-2 border-[#FF1744] border-t-transparent rounded-full animate-spin mx-auto" />
                          ) : remaining > 0 ? (
                            formatCountdown(remaining)
                          ) : (
                            "Close"
                          )}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                        <span className="text-[#A0A0B0]">Entry: <span className="text-[#F5F5F5]">{t.open_price}</span></span>
                        <span className={cn("text-right font-semibold", t.unrealized_pnl >= 0 ? "text-[#00C853]" : "text-[#FF1744]")}>
                          {t.unrealized_pnl >= 0 ? "+" : ""}${t.unrealized_pnl.toFixed(2)}
                        </span>
                        <span className="text-[#A0A0B0]">Lots: <span className="text-[#F5F5F5]">{t.volume}</span></span>
                        <span className={cn("text-right font-mono", remaining > 120000 ? "text-[#A0A0B0]" : remaining > 60000 ? "text-[#D4A843]" : "text-[#FF1744]")}>
                          {formatCountdown(remaining)}
                        </span>
                        <span className="text-[#A0A0B0] text-[10px]">Age: {t.age_minutes}m / {t.duration}m</span>
                        <span className="text-right text-[#A0A0B0]">{t.bid && t.ask ? `Mkt: ${((t.bid + t.ask) / 2).toFixed(5)}` : ""}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog
        open={showConfirmOrder}
        onClose={() => !placing && setShowConfirmOrder(false)}
        title="Confirm Order"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              { label: "Action", value: orderType.toUpperCase(), color: orderType === "buy" ? "#00C853" : "#FF1744" },
              { label: "Instrument", value: selectedInstrument },
              { label: "Volume", value: `${volume} lots` },
              { label: "Duration", value: `${tradeDuration} min` },
              { label: "Price", value: orderType === "buy" ? (price ? price.ask.toFixed(5) : "—") : (price ? price.bid.toFixed(5) : "—") },
              ...(stopLoss ? [{ label: "Stop Loss", value: stopLoss }] : []),
              ...(takeProfit ? [{ label: "Take Profit", value: takeProfit }] : []),
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#0A0B0F]">
                <span className="text-xs text-[#A0A0B0]">{row.label}</span>
                <span className="text-sm font-semibold" style={"color" in row ? { color: row.color } : { color: "#F5F5F5" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/20 text-xs text-[#A0A0B0]">
            By confirming, you agree to execute this trade at the current market price.
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={confirmOrder}
              disabled={placing}
              className="flex-1"
            >
              {placing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#0A0B0F] border-t-transparent rounded-full animate-spin" />
                  Executing...
                </span>
              ) : "Confirm Order"}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowConfirmOrder(false)}
              disabled={placing}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!showConfirmClose}
        onClose={() => !closing && setShowConfirmClose(null)}
        title="Close Trade"
      >
        {showConfirmClose && (() => {
          const trade = openTrades.find((t) => t.id === showConfirmClose)
          if (!trade) return null
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  { label: "Instrument", value: trade.symbol },
                  { label: "Type", value: trade.type.toUpperCase() },
                  { label: "Entry Price", value: trade.open_price.toFixed(5) },
                  { label: "Volume", value: `${trade.volume} lots` },
                  { label: "Unrealized P&L", value: `${trade.unrealized_pnl >= 0 ? "+" : ""}$${trade.unrealized_pnl.toFixed(2)}`, color: trade.unrealized_pnl >= 0 ? "#00C853" : "#FF1744" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#0A0B0F]">
                    <span className="text-xs text-[#A0A0B0]">{row.label}</span>
                    <span className="text-sm font-semibold" style={"color" in row ? { color: row.color } : { color: "#F5F5F5" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => confirmClose(showConfirmClose)}
                  disabled={!!closing}
                  className="flex-1 bg-gradient-to-r from-[#FF1744] to-[#D50000] text-white"
                >
                  {closing ? "Closing..." : "Yes, Close Trade"}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowConfirmClose(null)}
                  disabled={!!closing}
                  className="flex-1"
                >
                  Keep Open
                </Button>
              </div>
            </div>
          )
        })()}
      </Dialog>
    </div>
    </ErrorBoundary>
  )
}
