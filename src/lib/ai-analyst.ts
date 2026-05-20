import { generateTechnicalSignal } from "./signal-generator"
import { calculateIndicators } from "./ta-engine"
import { getRealTimePrice } from "./prices"
import { fetchFinancialNews } from "./news"

const SYMBOLS = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","XAUUSD","BTCUSD","ETHUSD","USOIL","SP500"]

export interface TradeSignal {
  symbol: string
  direction: "buy" | "sell"
  confidence: number
  entryPriceMin: number
  entryPriceMax: number
  stopLoss: number
  takeProfit: number
  rationale: string
  timeframe: string
}

export async function generateTradeSignal(): Promise<TradeSignal | null> {
  return generateTechnicalSignal()
}

export async function getAIMarketSummary(): Promise<string> {
  const [news] = await Promise.all([fetchFinancialNews()])

  const parts: string[] = []
  for (const symbol of SYMBOLS) {
    const [price, ind] = await Promise.all([
      getRealTimePrice(symbol),
      calculateIndicators(symbol),
    ])
    if (!price || !ind) continue

    let signal = "~"
    if (ind.rsi > 70) signal = "overbought"
    else if (ind.rsi < 30) signal = "oversold"
    else if (ind.sma20 > ind.sma50) signal = "bullish"
    else if (ind.sma20 < ind.sma50) signal = "bearish"

    parts.push(`${symbol}: ${price.mid} (${signal}, RSI ${Math.round(ind.rsi)})`)
  }

  const headlineCount = news.length
  return `${parts.join(", ")}. News volume: ${headlineCount} headlines.`
}
