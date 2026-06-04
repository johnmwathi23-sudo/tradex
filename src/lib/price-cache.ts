import type { Candle } from "./market-data/provider"

const MAX_CANDLES_PER_SYMBOL = 500

type SymbolCandleBuffer = {
  candles: Candle[]
  latestTick: { price: number; timestamp: number } | null
}

const buffers = new Map<string, SymbolCandleBuffer>()

function getBuffer(symbol: string): SymbolCandleBuffer {
  let buf = buffers.get(symbol)
  if (!buf) {
    buf = { candles: [], latestTick: null }
    buffers.set(symbol, buf)
  }
  return buf
}

export function upsertCandle(symbol: string, candle: Candle): void {
  const buf = getBuffer(symbol)
  const idx = buf.candles.findLastIndex((c) => c.time === candle.time)

  if (idx >= 0) {
    buf.candles[idx] = candle
  } else {
    buf.candles.push(candle)
    buf.candles.sort((a, b) => a.time - b.time)
    if (buf.candles.length > MAX_CANDLES_PER_SYMBOL) {
      buf.candles.splice(0, buf.candles.length - MAX_CANDLES_PER_SYMBOL)
    }
  }
}

export function upsertCandles(symbol: string, newCandles: Candle[]): void {
  const buf = getBuffer(symbol)
  for (const candle of newCandles) {
    const idx = buf.candles.findLastIndex((c) => c.time === candle.time)
    if (idx >= 0) {
      buf.candles[idx] = candle
    } else {
      buf.candles.push(candle)
    }
  }
  buf.candles.sort((a, b) => a.time - b.time)
  if (buf.candles.length > MAX_CANDLES_PER_SYMBOL) {
    buf.candles.splice(0, buf.candles.length - MAX_CANDLES_PER_SYMBOL)
  }
}

export function getCandles(symbol: string, count?: number): Candle[] {
  const buf = buffers.get(symbol.toUpperCase())
  if (!buf) return []
  if (count != null) {
    return buf.candles.slice(-count)
  }
  return buf.candles
}

export function getLatestCandle(symbol: string): Candle | null {
  const buf = buffers.get(symbol.toUpperCase())
  if (!buf || buf.candles.length === 0) return null
  return buf.candles[buf.candles.length - 1]
}

export function getLatestTick(symbol: string): { price: number; timestamp: number } | null {
  const buf = buffers.get(symbol.toUpperCase())
  return buf?.latestTick ?? null
}

export function setLatestTick(symbol: string, price: number, timestamp: number): void {
  const buf = getBuffer(symbol.toUpperCase())
  buf.latestTick = { price, timestamp }
}

export function getAllSymbols(): string[] {
  return Array.from(buffers.keys())
}

export function clearCache(symbol?: string): void {
  if (symbol) {
    buffers.delete(symbol.toUpperCase())
  } else {
    buffers.clear()
  }
}
