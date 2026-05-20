const cache = new Map<string, { bid: number; ask: number; time: number }>()
const CACHE_TTL = 2000

const symbolSources: Record<string, { api: string; from: string; to: string }> = {
  EURUSD:  { api: "forex", from: "EUR", to: "USD" },
  GBPUSD:  { api: "forex", from: "GBP", to: "USD" },
  USDJPY:  { api: "forex", from: "USD", to: "JPY" },
  USDCHF:  { api: "forex", from: "USD", to: "CHF" },
  AUDUSD:  { api: "forex", from: "AUD", to: "USD" },
  USDCAD:  { api: "forex", from: "USD", to: "CAD" },
  NZDUSD:  { api: "forex", from: "NZD", to: "USD" },
  EURGBP:  { api: "forex", from: "EUR", to: "GBP" },
  EURJPY:  { api: "forex", from: "EUR", to: "JPY" },
  GBPJPY:  { api: "forex", from: "GBP", to: "JPY" },
  XAUUSD:  { api: "commodity", from: "XAU", to: "USD" },
  XAGUSD:  { api: "commodity", from: "XAG", to: "USD" },
  USOIL:   { api: "commodity", from: "USOIL", to: "USD" },
  BTCUSD:  { api: "crypto", from: "bitcoin", to: "usd" },
  ETHUSD:  { api: "crypto", from: "ethereum", to: "usd" },
  SP500:   { api: "index", from: "SPX", to: "USD" },
  NAS100:  { api: "index", from: "NDX", to: "USD" },
  UK100:   { api: "index", from: "UK100", to: "USD" },
}

const baselines: Record<string, number> = {
  EURUSD: 1.0830, GBPUSD: 1.2650, USDJPY: 153.50, USDCHF: 0.8950,
  AUDUSD: 0.6550, USDCAD: 1.3650, NZDUSD: 0.6020, EURGBP: 0.8560,
  EURJPY: 166.20, GBPJPY: 194.10,
  XAUUSD: 2380.00, XAGUSD: 30.50, USOIL: 78.50,
  BTCUSD: 68500, ETHUSD: 3450,
  SP500: 5350, NAS100: 18700, UK100: 8250,
}

async function fetchForex(from: string, to: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, {
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    if (data.rates?.[to]) return data.rates[to]
    return null
  } catch {
    return null
  }
}

async function fetchCrypto(id: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    )
    const data = await res.json()
    if (data[id]?.usd) return data[id].usd
    return null
  } catch {
    return null
  }
}

function getSpread(symbol: string): number {
  if (symbol.startsWith("BTC") || symbol.startsWith("ETH")) return 0.001
  if (symbol.startsWith("XAU") || symbol.startsWith("XAG")) return 0.0005
  if (symbol.startsWith("USOIL")) return 0.001
  if (symbol.includes("JPY")) return 0.0002
  return 0.00015
}

export async function getRealTimePrice(symbol: string): Promise<{
  bid: number; ask: number; spread: number; mid: number; source: string
} | null> {
  const s = symbol.toUpperCase()
  const cached = cache.get(s)
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return { bid: cached.bid, ask: cached.ask, spread: Number(((cached.ask - cached.bid)).toFixed(5)), mid: (cached.bid + cached.ask) / 2, source: "cache" }
  }

  const source = symbolSources[s]
  if (!source) return null

  let midPrice: number | null = null
  let dataSource = "reference"

  if (source.api === "forex") {
    midPrice = await fetchForex(source.from, source.to)
    if (midPrice) dataSource = "live"
  } else if (source.api === "crypto") {
    midPrice = await fetchCrypto(source.from)
    if (midPrice) dataSource = "live"
  } else {
    midPrice = baselines[s] || null
  }

  if (!midPrice) {
    midPrice = baselines[s] || 1.0
  }

  const spread = midPrice * getSpread(s)
  const bid = Number((midPrice - spread / 2).toFixed(source.api === "crypto" ? 2 : 5))
  const ask = Number((midPrice + spread / 2).toFixed(source.api === "crypto" ? 2 : 5))

  cache.set(s, { bid, ask, time: Date.now() })

  return { bid, ask, spread: Number(spread.toFixed(5)), mid: midPrice, source: dataSource }
}
