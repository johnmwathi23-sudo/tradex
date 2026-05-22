"use client"

import { useRef, useEffect, useMemo } from "react"

const baselines: Record<string, number> = {
  EURUSD: 1.0830, GBPUSD: 1.2650, USDJPY: 153.50, USDCHF: 0.8950,
  AUDUSD: 0.6550, USDCAD: 1.3650, NZDUSD: 0.6020, EURGBP: 0.8560,
  EURJPY: 166.20, GBPJPY: 194.10,
  XAUUSD: 2380.00, XAGUSD: 30.50, USOIL: 78.50,
  BTCUSD: 68500, ETHUSD: 3450,
  SP500: 5350, NAS100: 18700, UK100: 8250,
}

function generateHistory(symbol: string, count: number): number[] {
  const base = baselines[symbol] || 1.0
  const points: number[] = [base]
  for (let i = 1; i < count; i++) {
    const change = (Math.random() - 0.5) * base * 0.002
    points.push(Number((points[i - 1] + change).toFixed(5)))
  }
  return points
}

type Position = {
  id: string
  symbol: string
  type: "buy" | "sell"
  open_price: number
  volume: number
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const history = useMemo(() => generateHistory(symbol, 200), [symbol])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const pad = { top: 20, bottom: 20, left: 50, right: 20 }

    const data = [...history]
    if (currentPrice) data.push(currentPrice)

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const xScale = (i: number) => pad.left + (i / (data.length - 1)) * (w - pad.left - pad.right)
    const yScale = (v: number) => pad.top + (1 - (v - min) / range) * (h - pad.top - pad.bottom)

    ctx.clearRect(0, 0, w, h)

    ctx.strokeStyle = "#1A1D29"
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * (h - pad.top - pad.bottom)
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(w - pad.right, y)
      ctx.stroke()

      const val = max - (i / 4) * range
      ctx.fillStyle = "#A0A0B0"
      ctx.font = "10px monospace"
      ctx.textAlign = "right"
      ctx.fillText(val.toFixed(symbol === "BTCUSD" || symbol === "ETHUSD" ? 0 : 5), pad.left - 5, y + 3)
    }

    const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom)
    gradient.addColorStop(0, "rgba(212, 168, 67, 0.2)")
    gradient.addColorStop(1, "rgba(212, 168, 67, 0)")

    ctx.beginPath()
    data.forEach((v, i) => {
      const x = xScale(i)
      const y = yScale(v)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = "#D4A843"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.lineTo(xScale(data.length - 1), h - pad.bottom)
    ctx.lineTo(xScale(0), h - pad.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    const myPositions = positions.filter((p) => p.symbol === symbol)
    myPositions.forEach((p) => {
      const x = xScale(data.length - 1)
      const y = yScale(p.open_price)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = p.type === "buy" ? "#00C853" : "#FF1744"
      ctx.fill()
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = p.type === "buy" ? "#00C853" : "#FF1744"
      ctx.font = "10px monospace"
      ctx.textAlign = "left"
      ctx.fillText(`${p.type.toUpperCase()} ${p.volume}`, x + 8, y + 3)
    })

    const lastVal = currentPrice || data[data.length - 1]
    ctx.fillStyle = "#F5F5F5"
    ctx.font = "bold 14px monospace"
    ctx.textAlign = "right"
    ctx.fillText(lastVal.toFixed(symbol === "BTCUSD" || symbol === "ETHUSD" ? 2 : 5), w - pad.right, pad.top + 14)
  }, [symbol, currentPrice, history, positions])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
