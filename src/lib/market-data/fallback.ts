import type { PriceFeed, PriceFeedConfig, PriceFeedEvent, Candle, ConnectionStatus } from "./provider"

const REST_URL = "https://api.twelvedata.com"
const POLL_INTERVAL = 10000
const MAX_CANDLES = 200

export class RestFallbackFeed implements PriceFeed {
  private config: PriceFeedConfig
  private status: ConnectionStatus = "disconnected"
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private subscribedSymbols = new Set<string>()
  private candles = new Map<string, Candle[]>()
  private active = false

  constructor(config: PriceFeedConfig) {
    this.config = config
  }

  private emit(event: PriceFeedEvent): void {
    try {
      this.config.onEvent(event)
    } catch {
      // subscriber error — never let a bad callback kill the feed
    }
  }

  private setStatus(status: ConnectionStatus, message?: string): void {
    this.status = status
    this.emit({ type: "status", status, message })
  }

  connect(): void {
    if (this.active) return
    this.active = true
    this.setStatus("connected")

    for (const symbol of this.config.symbols) {
      this.subscribedSymbols.add(symbol.toUpperCase())
    }

    this.fetchAndEmit()

    this.pollTimer = setInterval(() => {
      this.fetchAndEmit()
    }, POLL_INTERVAL)
  }

  disconnect(): void {
    this.active = false
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    this.setStatus("disconnected")
  }

  subscribe(symbol: string): void {
    this.subscribedSymbols.add(symbol.toUpperCase())
    this.fetchCandles(symbol.toUpperCase())
  }

  unsubscribe(symbol: string): void {
    this.subscribedSymbols.delete(symbol.toUpperCase())
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  private async fetchAndEmit(): Promise<void> {
    const symbols = Array.from(this.subscribedSymbols)
    await Promise.allSettled(symbols.map((s) => this.fetchCandles(s)))
  }

  private async fetchCandles(symbol: string): Promise<void> {
    try {
      const url = `${REST_URL}/time_series?symbol=${symbol}&interval=1min&outputsize=${MAX_CANDLES}&apikey=${this.config.apiKey}`
      const res = await fetch(url)
      if (!res.ok) return

      const data = await res.json()
      if (!data.values || !Array.isArray(data.values)) return

      const candles: Candle[] = data.values
        .filter((v: Record<string, string>) => v.datetime && v.open && v.high && v.low && v.close)
        .map((v: Record<string, string>) => ({
          time: Math.floor(new Date(v.datetime).getTime() / 1000),
          open: Number(v.open),
          high: Number(v.high),
          low: Number(v.low),
          close: Number(v.close),
          volume: v.volume ? Number(v.volume) : undefined,
        }))
        .filter((c: Candle) => !isNaN(c.time) && isFinite(c.time))
        .sort((a: Candle, b: Candle) => a.time - b.time)

      if (candles.length === 0) return

      this.candles.set(symbol, candles)

      const latest = candles[candles.length - 1]
      if (latest) {
        this.emit({ type: "candle", symbol, candle: latest })
      }
    } catch {
      // fetch failed — will retry on next poll
    }
  }
}
