import { GoogleGenerativeAI } from "@google/generative-ai"
import { getRealTimePrice } from "./prices"
import { fetchFinancialNews } from "./news"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const SIGNAL_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "XAUUSD", "BTCUSD", "ETHUSD", "USOIL", "SP500"]

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

interface PriceSnapshot {
  symbol: string
  bid: number
  ask: number
  mid: number
}

async function getPrices(): Promise<PriceSnapshot[]> {
  const results = await Promise.allSettled(
    SIGNAL_SYMBOLS.map(async (s) => {
      const price = await getRealTimePrice(s)
      return price ? { symbol: s, bid: price.bid, ask: price.ask, mid: price.mid } : null
    })
  )
  return results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => (r as PromiseFulfilledResult<PriceSnapshot>).value)
}

export async function generateTradeSignal(): Promise<TradeSignal | null> {
  const [news, prices] = await Promise.all([fetchFinancialNews(), getPrices()])

  if (prices.length === 0) throw new Error("No market prices available")

  const headlines = news.slice(0, 15).map((n) => n.title)

  const priceContext = prices
    .map((p) => `${p.symbol}: Bid=${p.bid}, Ask=${p.ask}, Mid=${p.mid}`)
    .join("\n")

  const newsContext = headlines.length ? headlines.join("\n- ") : "No recent news headlines available"

  const prompt = `You are AlphaTrader, a professional forex and crypto trading AI. Analyze the current market data and news, then recommend ONE high-confidence trade signal.

MARKET PRICES:
${priceContext}

RECENT NEWS HEADLINES:
- ${newsContext}

Based on this data, output ONLY a valid JSON object (no markdown, no code fences, no extra text before or after) with this exact structure:
{"symbol":"one of: EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, XAUUSD, BTCUSD, ETHUSD, USOIL, SP500","direction":"buy or sell","confidence":0-100,"entryPriceMin":number,"entryPriceMax":number,"stopLoss":number,"takeProfit":number,"rationale":"brief explanation in 2-3 sentences","timeframe":"1h or 4h or 1d"}

Consider current price levels, market sentiment from news, technical positioning, and risk management (stop loss should be reasonable, take profit at least 1.5x the risk).`

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  let cleaned = text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) cleaned = jsonMatch[0]

  const signal = JSON.parse(cleaned) as TradeSignal

  if (!signal.symbol || !signal.direction || signal.confidence == null) {
    throw new Error(`Invalid signal from AI: ${cleaned.slice(0, 200)}`)
  }

  return signal
}

export async function getAIMarketSummary(): Promise<string> {
  const [news, prices] = await Promise.all([fetchFinancialNews(), getPrices()])

  if (prices.length === 0) return "Market data unavailable."

  const headlines = news.slice(0, 10).map((n) => n.title)
  const priceContext = prices
    .map((p) => `${p.symbol}: ${p.mid}`)
    .join(", ")

  const prompt = `Summarize the current forex and crypto market in 2-3 sentences based on these prices and news. Focus on key movers and overall sentiment.

Prices: ${priceContext}
News: ${headlines.join(" | ")}`

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
