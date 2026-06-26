"use client"

import { useEffect, useRef, useState } from "react"

const TV_SYMBOLS: Record<string, string> = {
  EURUSD: "FX:EURUSD",
  GBPUSD: "FX:GBPUSD",
  USDJPY: "FX:USDJPY",
  USDCHF: "FX:USDCHF",
  AUDUSD: "FX:AUDUSD",
  USDCAD: "FX:USDCAD",
  NZDUSD: "FX:NZDUSD",
  EURGBP: "FX:EURGBP",
  EURJPY: "FX:EURJPY",
  GBPJPY: "FX:GBPJPY",
  XAUUSD: "FX:XAUUSD",
  XAGUSD: "FX:XAGUSD",
  USOIL: "TVC:USOIL",
  BTCUSD: "BINANCE:BTCUSDT",
  ETHUSD: "BINANCE:ETHUSDT",
  SP500: "SP:SPX",
  NAS100: "NASDAQ:NDX",
  UK100: "FTSE:UKX",
}

const TIMEFRAMES = [
  { label: "1m", value: "1" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "30m", value: "30" },
  { label: "1h", value: "60" },
  { label: "4h", value: "240" },
  { label: "1d", value: "D" },
  { label: "1W", value: "W" },
  { label: "1M", value: "M" },
]

const instruments = Object.keys(TV_SYMBOLS)

declare global {
  interface Window {
    TradingView?: {
      widget: any
    }
  }
}

export default function TradingViewChart({ height = 500 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  const scriptLoadedRef = useRef(false)
  const [symbol, setSymbol] = useState("EURUSD")
  const [interval, setInterval] = useState("60")
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState("")

  useEffect(() => {
    if (typeof window.TradingView !== "undefined") {
      scriptLoadedRef.current = true
      setScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = () => {
      scriptLoadedRef.current = true
      setScriptLoaded(true)
    }
    script.onerror = () => {
      setScriptError("Failed to load TradingView chart library")
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  function createWidget(sym: string, int: string) {
    if (!containerRef.current || !window.TradingView) return

    if (widgetRef.current) {
      try { widgetRef.current.remove() } catch {}
      widgetRef.current = null
    }

    const tvSymbol = TV_SYMBOLS[sym] || sym

    widgetRef.current = new window.TradingView.widget({
      container_id: containerRef.current.id,
      symbol: tvSymbol,
      interval: int,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#0A0B0F",
      enable_publishing: false,
      allow_symbol_change: true,
      withdateranges: true,
      hide_side_toolbar: false,
      details: true,
      hotlist: true,
      calendar: true,
      studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
      width: "100%",
      height: height,
      backgroundColor: "#0A0B0F",
      drawings_access: { type: "black", tools: [] },
    })
  }

  useEffect(() => {
    if (!scriptLoaded) return
    createWidget(symbol, interval)
    return () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove() } catch {}
      }
    }
  }, [scriptLoaded, height])

  useEffect(() => {
    if (!widgetRef.current || !window.TradingView) return
    const tvSymbol = TV_SYMBOLS[symbol] || symbol
    widgetRef.current.setSymbol(tvSymbol, interval)
  }, [symbol])

  useEffect(() => {
    if (!widgetRef.current || !window.TradingView) return
    const tvSymbol = TV_SYMBOLS[symbol] || symbol
    widgetRef.current.setSymbol(tvSymbol, interval)
  }, [interval])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm focus:border-[#D4A843]/50 focus:outline-none"
        >
          {instruments.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex gap-1 bg-[#0A0B0F] rounded-xl border border-white/10 p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setInterval(tf.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                interval === tf.value
                  ? "bg-[#D4A843] text-[#0A0B0F]"
                  : "text-[#A0A0B0] hover:text-[#F5F5F5]"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {!scriptLoaded && !scriptError && (
          <span className="text-xs text-[#D4A843]">Loading chart...</span>
        )}
      </div>

      {scriptError && (
        <div className="p-3 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20 text-sm text-[#FF1744]">
          {scriptError}
        </div>
      )}

      <div
        id="tv-chart-container"
        ref={containerRef}
        style={{ width: "100%", height }}
        className="rounded-xl overflow-hidden border border-white/5"
      />
    </div>
  )
}
