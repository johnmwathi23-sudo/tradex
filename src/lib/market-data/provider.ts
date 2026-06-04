export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export type Tick = {
  symbol: string
  price: number
  bid?: number
  ask?: number
  timestamp: number
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error"

export type PriceFeedEvent =
  | { type: "tick"; tick: Tick }
  | { type: "candle"; symbol: string; candle: Candle }
  | { type: "status"; status: ConnectionStatus; message?: string }
  | { type: "error"; error: Error }

export type PriceFeedCallback = (event: PriceFeedEvent) => void

export interface PriceFeedConfig {
  apiKey: string
  symbols: string[]
  onEvent: PriceFeedCallback
  candleInterval?: number
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export interface PriceFeed {
  connect(): void
  disconnect(): void
  subscribe(symbol: string): void
  unsubscribe(symbol: string): void
  getStatus(): ConnectionStatus
}
