import { calculateIndicators, type TAIndicators } from "./ta-engine"
import { fetchFinancialNews, extractKeywords } from "./news"
import { getRealTimePrice } from "./prices"

const SYMBOLS = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","XAUUSD","BTCUSD","ETHUSD","USOIL","SP500"]

const symbolKeywords: Record<string, string[]> = {
  EURUSD: ["euro", "ecb", "european central bank", "eurozone", "germany", "eu"],
  GBPUSD: ["pound", "boe", "bank of england", "uk", "brexit", "britain"],
  USDJPY: ["yen", "boj", "bank of japan", "japan", "japanese"],
  AUDUSD: ["australian", "rba", "reserve bank", "australia", "commodity"],
  USDCAD: ["canadian", "boc", "bank of canada", "canada", "oil"],
  XAUUSD: ["gold", "safe haven", "precious metal", "xau"],
  BTCUSD: ["bitcoin", "btc", "crypto", "blockchain"],
  ETHUSD: ["ethereum", "eth", "crypto", "defi"],
  USOIL: ["oil", "crude", "opec", "energy", "petroleum"],
  SP500: ["sp500", "s&p", "wall street", "stock market", "fed", "federal reserve"],
}

function getSentiment(symbol: string, keywords: string[]): number {
  const relevant = symbolKeywords[symbol] || []
  let score = 0
  for (const kw of relevant) {
    const matches = keywords.filter((k) => k.includes(kw) || kw.includes(k)).length
    score += matches
  }
  return score
}

export async function generateTechnicalSignal(): Promise<{
  symbol: string
  direction: "buy" | "sell"
  confidence: number
  entryPriceMin: number
  entryPriceMax: number
  stopLoss: number
  takeProfit: number
  rationale: string
  timeframe: string
} | null> {
  const [news] = await Promise.all([fetchFinancialNews()])
  const keywords = extractKeywords(news)

  let bestSignal: { score: number; symbol: string; direction: "buy" | "sell"; conf: number; entry: number; sl: number; tp: number; reason: string } | null = null

  for (const symbol of SYMBOLS) {
    const ind = await calculateIndicators(symbol)
    if (!ind) continue

    const price = await getRealTimePrice(symbol)
    if (!price) continue

    const mid = price.mid
    const sentiment = getSentiment(symbol, keywords)

    let buySignals = 0
    let sellSignals = 0
    const reasons: string[] = []

    if (ind.rsi < 30) { buySignals++; reasons.push("RSI oversold") }
    else if (ind.rsi > 70) { sellSignals++; reasons.push("RSI overbought") }

    if (mid < ind.lowerBand) { buySignals++; reasons.push("Price below lower Bollinger") }
    else if (mid > ind.upperBand) { sellSignals++; reasons.push("Price above upper Bollinger") }

    if (ind.sma20 > ind.sma50) { buySignals++; reasons.push("SMA20 > SMA50") }
    else if (ind.sma20 < ind.sma50) { sellSignals++; reasons.push("SMA20 < SMA50") }

    if (ind.macdHistogram > 0 && ind.macdHistogram > 0.0001) { buySignals++; reasons.push("MACD bullish crossover") }
    else if (ind.macdHistogram < 0 && ind.macdHistogram < -0.0001) { sellSignals++; reasons.push("MACD bearish crossover") }

    if (sentiment > 0) { buySignals++; reasons.push("Positive news sentiment") }
    else if (sentiment < 0) { sellSignals++; reasons.push("Negative news sentiment") }

    const total = buySignals + sellSignals
    if (total < 2) continue

    const direction = buySignals > sellSignals ? "buy" : sellSignals > buySignals ? "sell" : null
    if (!direction) continue

    const confidence = Math.round((Math.max(buySignals, sellSignals) / total) * 100)
    if (confidence < 55) continue

    const spread = price.ask - price.bid
    const entryPrice = direction === "buy" ? price.ask : price.bid
    const atr = ((ind.upperBand - ind.lowerBand) / 2) * 0.1

    const sl = direction === "buy"
      ? Math.round((entryPrice - atr * 1.5) * 100000) / 100000
      : Math.round((entryPrice + atr * 1.5) * 100000) / 100000

    const tp = direction === "buy"
      ? Math.round((entryPrice + atr * 3) * 100000) / 100000
      : Math.round((entryPrice - atr * 3) * 100000) / 100000

    const score = confidence + sentiment * 5

    if (!bestSignal || score > bestSignal.score) {
      bestSignal = {
        score,
        symbol,
        direction,
        conf: confidence,
        entry: entryPrice,
        sl,
        tp,
        reason: reasons.join("; "),
      }
    }
  }

  if (!bestSignal) return null

  const spread = bestSignal.entry * 0.0002
  return {
    symbol: bestSignal.symbol,
    direction: bestSignal.direction,
    confidence: bestSignal.conf,
    entryPriceMin: Math.round((bestSignal.entry - spread) * 100000) / 100000,
    entryPriceMax: Math.round((bestSignal.entry + spread) * 100000) / 100000,
    stopLoss: bestSignal.sl,
    takeProfit: bestSignal.tp,
    rationale: bestSignal.reason,
    timeframe: "1h",
  }
}
