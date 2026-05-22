"use client"

import { useEffect, useRef } from "react"

const symbolMap: Record<string, string> = {
  EURUSD: "FX:EURUSD", GBPUSD: "FX:GBPUSD", USDJPY: "FX:USDJPY",
  USDCHF: "FX:USDCHF", AUDUSD: "FX:AUDUSD", USDCAD: "FX:USDCAD",
  NZDUSD: "FX:NZDUSD", EURGBP: "FX:EURGBP", EURJPY: "FX:EURJPY",
  GBPJPY: "FX:GBPJPY", XAUUSD: "OANDA:XAUUSD", XAGUSD: "OANDA:XAGUSD",
  USOIL: "TVC:USOIL", BTCUSD: "COINBASE:BTCUSD", ETHUSD: "COINBASE:ETHUSD",
  SP500: "SP:SPX", NAS100: "NASDAQ:NDX", UK100: "OANDA:UK100",
}

type Position = {
  id: string
  symbol: string
  type: "buy" | "sell"
  open_price: number
  volume: number
}

export default function TradingViewChart({
  symbol,
  positions = [],
}: {
  symbol: string
  positions?: Position[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  const linesRef = useRef<any[]>([])

  function drawLines(widget: any) {
    if (!widget) return

    linesRef.current.forEach((l: any) => {
      try { widget.chart().removeEntity(l) } catch {}
    })
    linesRef.current = []

    const myPositions = positions.filter((p) => p.symbol === symbol)
    if (myPositions.length === 0) return

    const chart = widget.chart()

    myPositions.forEach((p) => {
      try {
        const line = chart.createPositionLine()
        line
          .setText(`${p.type.toUpperCase()} ${p.volume} lots`)
          .setPrice(p.open_price)
          .setQuantity(p.volume.toString())
          .setBodyTextColor(p.type === "buy" ? "#00C853" : "#FF1744")
          .setBodyBorderColor(p.type === "buy" ? "#00C853" : "#FF1744")
          .setBodyBackgroundColor(p.type === "buy" ? "#00C85320" : "#FF174420")
          .setLineColor(p.type === "buy" ? "#00C853" : "#FF1744")
          .setLineLength(20)
        linesRef.current.push(line)
      } catch {}
    })
  }

  function destroyWidget() {
    linesRef.current = []
    if (widgetRef.current) {
      try { widgetRef.current.remove() } catch {}
      widgetRef.current = null
    }
  }

  useEffect(() => {
    const tvSymbol = symbolMap[symbol] || `FX:${symbol}`
    const containerId = `tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}`

    destroyWidget()

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
          details: false,
          hotlist: false,
          calendar: false,
          studies: [],
          width: "100%",
          height: "100%",
          hide_side_toolbar: false,
          withdateranges: true,
          disabled_features: ["use_localstorage_for_settings", "header_symbol_search", "header_widget", "header_screenshot"],
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

        widget.onChartReady(() => {
          drawLines(widget)
        })
      } catch {}
    }

    if ((window as any).TradingView) {
      initWidget()
    } else {
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/tv.js"
      script.async = true
      script.onload = initWidget
      script.onerror = () => {}
      document.body.appendChild(script)
    }

    return () => {
      mounted = false
      destroyWidget()
    }
  }, [symbol])

  useEffect(() => {
    if (widgetRef.current) {
      try {
        widgetRef.current.chart().setSymbol(symbolMap[symbol] || `FX:${symbol}`, () => {
          drawLines(widgetRef.current)
        })
      } catch {}
    }
  }, [symbol])

  useEffect(() => {
    if (widgetRef.current) {
      drawLines(widgetRef.current)
    }
  }, [positions])

  return <div ref={containerRef} className="w-full h-full" />
}
