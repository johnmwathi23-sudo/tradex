"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import TradingViewChart from "@/components/trading-view-chart"

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

const categories = ["forex", "commodities", "indices", "crypto"]

export default function TradingPage() {
  const [accounts, setAccounts] = useState<MtAccount[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedInstrument, setSelectedInstrument] = useState("EURUSD")
  const [activeCategory, setActiveCategory] = useState("forex")
  const [volume, setVolume] = useState("0.01")
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/mt/accounts")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setAccounts(list)
        const def = list.find((a: MtAccount) => a.is_default)
        if (def) setSelectedAccount(def.id)
        else if (list.length > 0) setSelectedAccount(list[0].id)
      })
      .catch(() => {})

    fetch("/api/mt/instruments")
      .then((r) => r.json())
      .then((data) => setInstruments(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const filteredInstruments = instruments.filter(
    (i) => i.category === activeCategory
  )

  async function placeOrder() {
    if (!selectedAccount || !selectedInstrument || !volume) return
    setPlacing(true)
    setMessage("")
    try {
      const res = await fetch("/api/mt/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mt_account_id: selectedAccount,
          symbol: selectedInstrument,
          type: orderType,
          volume,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`${orderType === "buy" ? "Buy" : "Sell"} order placed: ${selectedInstrument} @ ${data.open_price}`)
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setPlacing(false)
    }
  }

  const activeInstrument = instruments.find((i) => i.symbol === selectedInstrument)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Trading Terminal</h1>
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
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="h-[500px] bg-[#0A0B0F] relative">
            <TradingViewChart symbol={selectedInstrument} />
          </div>

          <div className="p-3 border-t border-white/5">
            <div className="flex gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition",
                    activeCategory === cat
                      ? "bg-[#D4A843]/15 text-[#D4A843]"
                      : "text-[#A0A0B0] hover:text-[#F5F5F5] hover:bg-white/5"
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

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Quick Order</h3>
          {!selectedAccount ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#A0A0B0]">No MT4/MT5 account connected</p>
              <a
                href="/dashboard/mt-accounts"
                className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#D4A843]/10 text-[#D4A843] text-sm font-medium hover:bg-[#D4A843]/20"
              >
                Connect Account
              </a>
            </div>
          ) : (
            <div className="space-y-3">
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
                      ? "bg-[#00C853] text-white"
                      : "bg-[#00C853]/15 text-[#00C853] hover:bg-[#00C853]/25"
                  )}
                >
                  Buy
                </button>
                <button
                  onClick={() => setOrderType("sell")}
                  className={cn(
                    "px-3 py-3 rounded-lg text-sm font-semibold transition",
                    orderType === "sell"
                      ? "bg-[#FF1744] text-white"
                      : "bg-[#FF1744]/15 text-[#FF1744] hover:bg-[#FF1744]/25"
                  )}
                >
                  Sell
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

              <Button
                variant="primary"
                className="w-full"
                onClick={placeOrder}
                disabled={placing}
              >
                {placing ? "Placing..." : `${orderType === "buy" ? "Buy" : "Sell"} ${selectedInstrument}`}
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
      </div>
    </div>
  )
}
