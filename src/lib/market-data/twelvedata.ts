import type { PriceFeed, PriceFeedConfig, PriceFeedEvent, Candle, ConnectionStatus, Tick } from "./provider"

const DEFAULT_CANDLE_INTERVAL = 60
const DEFAULT_RECONNECT_INTERVAL = 3000
const MAX_RECONNECT_ATTEMPTS = 10
const WS_URL = "wss://ws.twelvedata.com/v1/quotes"

export class TwelveDataFeed implements PriceFeed {
  private ws: WebSocket | null = null
  private config: PriceFeedConfig
  private status: ConnectionStatus = "disconnected"
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private subscribedSymbols = new Set<string>()
  private candles = new Map<string, Candle>()
  private lastTickTimestamps = new Map<string, number>()
  private intentionalClose = false

  constructor(config: PriceFeedConfig) {
    this.config = {
      candleInterval: DEFAULT_CANDLE_INTERVAL,
      reconnectInterval: DEFAULT_RECONNECT_INTERVAL,
      maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
      ...config,
    }
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
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.intentionalClose = false
    this.setStatus("connecting")

    try {
      const url = `${WS_URL}?apikey=${this.config.apiKey}`
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.setStatus("connected")

        if (this.subscribedSymbols.size > 0) {
          this.sendSubscription(Array.from(this.subscribedSymbols))
        }
      }

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch {
          // skip malformed messages
        }
      }

      this.ws.onerror = () => {
        this.setStatus("error", "WebSocket connection error")
      }

      this.ws.onclose = () => {
        if (!this.intentionalClose) {
          this.setStatus("reconnecting")
          this.scheduleReconnect()
        } else {
          this.setStatus("disconnected")
        }
      }
    } catch (err) {
      this.setStatus("error", err instanceof Error ? err.message : "Failed to create WebSocket")
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.intentionalClose = true
    this.clearReconnectTimer()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // ignore close errors
      }
      this.ws = null
    }
    this.setStatus("disconnected")
  }

  subscribe(symbol: string): void {
    const normalized = symbol.toUpperCase()
    if (this.subscribedSymbols.has(normalized)) return
    this.subscribedSymbols.add(normalized)
    this.candles.delete(normalized)
    this.lastTickTimestamps.delete(normalized)

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription([normalized])
    }
  }

  unsubscribe(symbol: string): void {
    const normalized = symbol.toUpperCase()
    this.subscribedSymbols.delete(normalized)
    this.candles.delete(normalized)
    this.lastTickTimestamps.delete(normalized)

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendUnsubscription([normalized])
    }
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  private sendSubscription(symbols: string[]): void {
    this.send({
      action: "subscribe",
      params: { symbols: symbols.join(",") },
    })
  }

  private sendUnsubscription(symbols: string[]): void {
    this.send({
      action: "unsubscribe",
      params: { symbols: symbols.join(",") },
    })
  }

  private send(msg: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg))
      } catch {
        // send failed — will recover on reconnect
      }
    }
  }

  private handleMessage(data: Record<string, unknown>): void {
    if (!data.symbol || typeof data.symbol !== "string") return

    const symbol = (data.symbol as string).toUpperCase()
    const price = this.parsePrice(data)
    if (price == null) return

    const timestamp = typeof data.timestamp === "number"
      ? data.timestamp * 1000
      : typeof data.timestamp === "string"
        ? new Date(data.timestamp as string).getTime()
        : Date.now()

    const bid = data.bid != null ? Number(data.bid) : undefined
    const ask = data.ask != null ? Number(data.ask) : undefined

    const tick: Tick = { symbol, price, bid, ask, timestamp }
    this.emit({ type: "tick", tick })

    this.updateCandle(symbol, price, timestamp)
  }

  private parsePrice(data: Record<string, unknown>): number | null {
    if (typeof data.price === "number") return data.price
    if (typeof data.price === "string") return Number(data.price)
    // fallback: use mid of bid/ask
    if (typeof data.bid === "number" && typeof data.ask === "number") {
      return (data.bid + data.ask) / 2
    }
    return null
  }

  private updateCandle(symbol: string, price: number, timestamp: number): void {
    const interval = this.config.candleInterval ?? DEFAULT_CANDLE_INTERVAL
    const candleTime = Math.floor(timestamp / (interval * 1000)) * (interval * 1000)

    const existing = this.candles.get(symbol)

    if (existing && existing.time === candleTime) {
      const updated: Candle = {
        time: existing.time,
        open: existing.open,
        high: Math.max(existing.high, price),
        low: Math.min(existing.low, price),
        close: price,
        volume: (existing.volume ?? 0) + 1,
      }
      this.candles.set(symbol, updated)
      this.emit({ type: "candle", symbol, candle: updated })
    } else {
      const newCandle: Candle = {
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 1,
      }
      this.candles.set(symbol, newCandle)
      this.emit({ type: "candle", symbol, candle: newCandle })
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer()

    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS)) {
      this.setStatus("error", "Max reconnection attempts reached")
      return
    }

    const delay = Math.min(
      (this.config.reconnectInterval ?? DEFAULT_RECONNECT_INTERVAL) * Math.pow(1.5, this.reconnectAttempts),
      30000
    )

    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}
