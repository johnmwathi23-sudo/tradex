"use client"

import { useEffect, useRef } from "react"
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type LineStyle } from "lightweight-charts"

const baselines: Record<string, number> = {
  EURUSD: 1.0830, GBPUSD: 1.2650, USDJPY: 153.50, USDCHF: 0.8950,
  AUDUSD: 0.6550, USDCAD: 1.3650, NZDUSD: 0.6020, EURGBP: 0.8560,
  EURJPY: 166.20, GBPJPY: 194.10,
  XAUUSD: 2380.00, XAGUSD: 30.50, USOIL: 78.50,
  BTCUSD: 68500, ETHUSD: 3450,
  SP500: 5350, NAS100: 18700, UK100: 8250,
}

const digits: Record<string, number> = {
  USDJPY: 3, EURJPY: 3, GBPJPY: 3,
  XAUUSD: 2, XAGUSD: 3, USOIL: 2,
  BTCUSD: 1, ETHUSD: 1,
  SP500: 2, NAS100: 2, UK100: 2,
}

type Position = {
  id: string
  symbol: string
  type: "buy" | "sell"
  open_price: number
  volume: number
}

function generateCandles(symbol: string, count: number, interval: number, currentPrice?: number | null): CandlestickData[] {
  const base = baselines[symbol] || 1.0
  const now = Math.floor(Date.now() / 1000)
  const result: CandlestickData[] = []
  let price = base

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * interval
    const vol = base * 0.0005
    const open = price
    const close = Number((open + (Math.random() - 0.5) * vol).toFixed(5))
    const high = Number((Math.max(open, close) + Math.random() * vol * 0.3).toFixed(5))
    const low = Number((Math.min(open, close) - Math.random() * vol * 0.3).toFixed(5))
    price = close
    result.push({ time, open, high, low, close } as CandlestickData)
  }

  if (currentPrice != null) {
    const offset = currentPrice - result[result.length - 1].close
    for (const c of result) {
      c.close = Number((c.close + offset).toFixed(5))
      c.open = Number((c.open + offset).toFixed(5))
      c.high = Number((c.high + offset).toFixed(5))
      c.low = Number((c.low + offset).toFixed(5))
    }
  }

  return result
}

export default function SimulatedChart({
  symbol,
  currentPrice,
  positions = [],
}: {
  symbol: string
  currentPrice?: number | null
  positions?: Position[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const dataRef = useRef<CandlestickData[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickCountRef = useRef(0)
  const currentCandleRef = useRef<CandlestickData | null>(null)
  const initedRef = useRef(false)

  function clearTick() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }

  function initChart(sym: string, price: number) {
    const container = containerRef.current
    if (!container) return

    clearTick()
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      seriesRef.current = null
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#0A0B0F" },
        textColor: "#A0A0B0",
      },
      grid: {
        vertLines: { color: "#1A1D29" },
        horzLines: { color: "#1A1D29" },
      },
      crosshair: {
        vertLine: { color: "#D4A843", style: 2 as LineStyle, width: 1, labelBackgroundColor: "#D4A843" },
        horzLine: { color: "#D4A843", style: 2 as LineStyle, width: 1, labelBackgroundColor: "#D4A843" },
      },
      timeScale: {
        borderColor: "#1A1D29",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#1A1D29",
        textColor: "#A0A0B0",
      },
      handleScroll: true,
      handleScale: true,
      width: container.clientWidth,
      height: container.clientHeight,
    })

    chartRef.current = chart

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00C853",
      downColor: "#FF1744",
      borderDownColor: "#FF1744",
      borderUpColor: "#00C853",
      wickDownColor: "#FF1744",
      wickUpColor: "#00C853",
      priceFormat: {
        type: "price",
        precision: digits[sym] || 5,
        minMove: 1 / Math.pow(10, digits[sym] || 5),
      },
    })

    seriesRef.current = series

    const interval = 60
    const candles = generateCandles(sym, 240, interval, price)
    dataRef.current = candles
    series.setData(candles)

    chart.timeScale().fitContent()

    const handleResize = () => {
      const rect = container.getBoundingClientRect()
      chart.applyOptions({ width: rect.width, height: rect.height })
    }
    window.addEventListener("resize", handleResize)

    const last = candles[candles.length - 1]
    currentCandleRef.current = { ...last }
    tickCountRef.current = 0

    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      const s = seriesRef.current
      if (!s) return

      const base = baselines[sym] || 1.0
      const vol = base * 0.0002
      const tick = (Math.random() - 0.5) * vol
      const candle = currentCandleRef.current
      if (!candle) return

      tickCountRef.current++
      const newClose = Number((candle.close + tick).toFixed(5))

      if (tickCountRef.current >= 10) {
        const newCandle: CandlestickData = {
          time: (candle.time as number) + 60,
          open: newClose,
          high: newClose,
          low: newClose,
          close: newClose,
        } as CandlestickData
        s.update(newCandle)
        currentCandleRef.current = newCandle
        dataRef.current.push(newCandle)
        tickCountRef.current = 0
      } else {
        const updated: CandlestickData = {
          time: candle.time,
          open: candle.open,
          high: Number(Math.max(candle.high, candle.high + tick).toFixed(5)),
          low: Number(Math.min(candle.low, candle.low + tick).toFixed(5)),
          close: newClose,
        } as CandlestickData
        s.update(updated)
        currentCandleRef.current = updated
      }
    }, 2000)

    initedRef.current = true

    return () => {
      window.removeEventListener("resize", handleResize)
      clearTick()
    }
  }

  useEffect(() => {
    if (currentPrice == null) return
    initChart(symbol, currentPrice)
  }, [symbol])

  useEffect(() => {
    if (currentPrice == null || initedRef.current) return
    initChart(symbol, currentPrice)
  }, [currentPrice])

  useEffect(() => {
    if (currentPrice == null) return
    if (!initedRef.current) return
    if (!seriesRef.current || !currentCandleRef.current) return
    const s = seriesRef.current
    const old = currentCandleRef.current
    const updated: CandlestickData = {
      time: old.time,
      open: old.open,
      high: Number(Math.max(old.high, currentPrice).toFixed(5)),
      low: Number(Math.min(old.low, currentPrice).toFixed(5)),
      close: currentPrice,
    } as CandlestickData
    s.update(updated)
    currentCandleRef.current = updated
  }, [currentPrice])

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return
    const series = seriesRef.current
    const lines: any[] = []
    const myPositions = positions.filter((p) => p.symbol === symbol)
    myPositions.forEach((p) => {
      try {
        const line = series.createPriceLine({
          price: p.open_price,
          color: p.type === "buy" ? "#00C853" : "#FF1744",
          lineWidth: 2,
          lineStyle: 2 as LineStyle,
          axisLabelVisible: true,
          title: `${p.type.toUpperCase()} ${p.volume}`,
        })
        lines.push(line)
      } catch {}
    })
    return () => {
      lines.forEach((l) => {
        try { series.removePriceLine(l) } catch {}
      })
    }
  }, [positions, symbol])

  return <div ref={containerRef} className="w-full h-full" />
}
