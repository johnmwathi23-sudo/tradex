import { supabaseAdmin } from "./supabase/admin"

export interface Candle {
  time: Date
  open: number
  high: number
  low: number
  close: number
}

export interface TAIndicators {
  rsi: number
  sma20: number
  sma50: number
  sma200: number
  macd: number
  macdSignal: number
  macdHistogram: number
  upperBand: number
  lowerBand: number
  middleBand: number
}

export async function getCandles(symbol: string, period: number = 300): Promise<Candle[]> {
  const { data } = await supabaseAdmin
    .from("price_history")
    .select("mid, recorded_at")
    .eq("symbol", symbol)
    .order("recorded_at", { ascending: true })
    .limit(period)

  if (!data || data.length < 2) return []

  const candles: Candle[] = []
  let current: Candle | null = null
  let intervalMs = 300000

  for (const row of data) {
    const t = new Date(row.recorded_at).getTime()
    const slot = Math.floor(t / intervalMs) * intervalMs
    const time = new Date(slot)
    const price = Number(row.mid)

    if (!current || current.time.getTime() !== slot) {
      if (current) candles.push(current)
      current = { time, open: price, high: price, low: price, close: price }
    } else {
      current.high = Math.max(current.high, price)
      current.low = Math.min(current.low, price)
      current.close = price
    }
  }
  if (current) candles.push(current)

  return candles
}

export function calcSMA(candles: Candle[], period: number): number[] {
  const result: number[] = []
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close
    result.push(sum / period)
  }
  return result
}

export function calcEMA(candles: Candle[], period: number): number[] {
  const multiplier = 2 / (period + 1)
  const result: number[] = []
  let ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period
  result.push(ema)
  for (let i = period; i < candles.length; i++) {
    ema = (candles[i].close - ema) * multiplier + ema
    result.push(ema)
  }
  return result
}

export function calcRSI(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 50

  let gains = 0, losses = 0
  for (let i = candles.length - period; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close
    if (diff > 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export function calcMACD(candles: Candle[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calcEMA(candles, 12)
  const ema26 = calcEMA(candles, 26)
  const offset = 26 - 12

  const macdLine: number[] = []
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    macdLine.push(ema12[i + offset] - ema26[i])
  }

  if (macdLine.length < 9) return { macd: 0, signal: 0, histogram: 0 }

  const signalLine = calcEMA(
    macdLine.map((v, i) => ({ time: new Date(), open: v, high: v, low: v, close: v })),
    9
  )

  return {
    macd: macdLine[macdLine.length - 1],
    signal: signalLine[signalLine.length - 1],
    histogram: macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1],
  }
}

export function calcBollingerBands(candles: Candle[], period: number = 20): { upper: number; middle: number; lower: number } {
  if (candles.length < period) {
    const mid = candles[candles.length - 1]?.close || 0
    return { upper: mid * 1.02, middle: mid, lower: mid * 0.98 }
  }

  const recent = candles.slice(-period)
  const sma = recent.reduce((s, c) => s + c.close, 0) / period
  const variance = recent.reduce((s, c) => s + (c.close - sma) ** 2, 0) / period
  const stdDev = Math.sqrt(variance)

  return { upper: sma + 2 * stdDev, middle: sma, lower: sma - 2 * stdDev }
}

export async function calculateIndicators(symbol: string): Promise<TAIndicators | null> {
  const candles = await getCandles(symbol)
  if (candles.length < 30) return null

  const close = candles[candles.length - 1].close

  const sma20Arr = calcSMA(candles, 20)
  const sma50Arr = calcSMA(candles, 50)
  const sma200Arr = calcSMA(candles, 200)

  const rsi = calcRSI(candles)
  const macd = calcMACD(candles)
  const bb = calcBollingerBands(candles)

  return {
    rsi,
    sma20: sma20Arr[sma20Arr.length - 1] || close,
    sma50: sma50Arr[sma50Arr.length - 1] || close,
    sma200: sma200Arr[sma200Arr.length - 1] || close,
    macd: macd.macd,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    upperBand: bb.upper,
    lowerBand: bb.lower,
    middleBand: bb.middle,
  }
}
