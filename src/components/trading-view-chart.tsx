"use client"

import { useEffect, useRef } from "react"

const symbolMap: Record<string, string> = {
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
  XAUUSD: "OANDA:XAUUSD",
  XAGUSD: "OANDA:XAGUSD",
  USOIL: "TVC:USOIL",
  BTCUSD: "COINBASE:BTCUSD",
  ETHUSD: "COINBASE:ETHUSD",
  SP500: "SP:SPX",
  NAS100: "NASDAQ:NDX",
  UK100: "OANDA:UK100",
}

export default function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    const tvSymbol = symbolMap[symbol] || `FX:${symbol}`

    if (widgetRef.current) {
      try {
        widgetRef.current.chart().setSymbol(tvSymbol, () => {})
        return
      } catch {}
    }

    const containerId = `tv_chart_${symbol}`
    if (containerRef.current) {
      containerRef.current.innerHTML = `<div id="${containerId}" style="width:100%;height:100%"></div>`
    }

    let mounted = true

    function initWidget() {
      if (!mounted) return
      const el = document.getElementById(containerId)
      if (!el) return

      try {
        const widget = new (window as any).TradingView.widget({
          container_id: containerId,
          symbol: tvSymbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "Dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0A0B0F",
          enable_publishing: false,
          allow_symbol_change: true,
          details: true,
          hotlist: false,
          calendar: true,
          studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies", "SMA@tv-basicstudies"],
          width: "100%",
          height: "100%",
          hide_side_toolbar: false,
          withdateranges: true,
          disabled_features: ["use_localstorage_for_settings", "header_symbol_search"],
          enabled_features: ["hide_exchange_logo_in_watermark"],
          overrides: {
            "paneProperties.background": "#0A0B0F",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "#1A1D29",
            "paneProperties.horzGridProperties.color": "#1A1D29",
            "paneProperties.crossHairProperties.color": "#D4A843",
            "scalesProperties.textColor": "#A0A0B0",
            "scalesProperties.lineColor": "#1A1D29",
          },
        })
        widgetRef.current = widget
      } catch {}
    }

    if ((window as any).TradingView) {
      initWidget()
    } else {
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/tv.js"
      script.async = true
      script.onload = initWidget
      document.body.appendChild(script)
    }

    return () => {
      mounted = false
    }
  }, [symbol])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
