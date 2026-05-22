const cache = new Map<string, { bid: number; ask: number; time: number }>()
const CACHE_TTL = 2000

const baselines: Record<string, number> = {
  EURUSD: 1.0830, GBPUSD: 1.2650, USDJPY: 153.50, USDCHF: 0.8950,
  AUDUSD: 0.6550, USDCAD: 1.3650, NZDUSD: 0.6020, EURGBP: 0.8560,
  EURJPY: 166.20, GBPJPY: 194.10,
  XAUUSD: 2380.00, XAGUSD: 30.50, USOIL: 78.50,
  BTCUSD: 68500, ETHUSD: 3450,
  SP500: 5350, NAS100: 18700, UK100: 8250,
}

let drift: Record<string, number> = {}

function seedDrift(symbol: string) {
  if (drift[symbol] === undefined) {
    drift[symbol] = (Math.random() - 0.5) * 0.0002
  }
}

function getSpread(symbol: string): number {
  if (symbol.startsWith("BTC") || symbol.startsWith("ETH")) return 0.001
  if (symbol.startsWith("XAU") || symbol.startsWith("XAG")) return 0.0005
  if (symbol.startsWith("USOIL")) return 0.001
  if (symbol.includes("JPY")) return 0.0002
  return 0.00015
}

export function getBaseline(symbol: string): number {
  return baselines[symbol] || 1.0
}

export function contractSize(symbol: string): number {
  const s = symbol.toUpperCase()
  if (["XAUUSD"].includes(s)) return 100
  if (["XAGUSD"].includes(s)) return 5000
  if (["USOIL"].includes(s)) return 100
  if (["SP500", "NAS100", "UK100"].includes(s)) return 1
  if (["BTCUSD", "ETHUSD"].includes(s)) return 1
  return 100000
}

export async function getRealTimePrice(symbol: string): Promise<{
  bid: number; ask: number; spread: number; mid: number; source: string
} | null> {
  const s = symbol.toUpperCase()
  const cached = cache.get(s)
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return {
      bid: cached.bid, ask: cached.ask,
      spread: Number(((cached.ask - cached.bid)).toFixed(5)),
      mid: (cached.bid + cached.ask) / 2, source: "simulated",
    }
  }

  seedDrift(s)
  const base = baselines[s] || 1.0
  const noise = (Math.random() - 0.5) * base * 0.0008
  const midPrice = Number((base + noise + drift[s]!).toFixed(5))
  drift[s]! += (Math.random() - 0.5) * 0.00005

  const spread = midPrice * getSpread(s)
  const isCrypto = s === "BTCUSD" || s === "ETHUSD"
  const decimals = isCrypto ? 2 : 5
  const bid = Number((midPrice - spread / 2).toFixed(decimals))
  const ask = Number((midPrice + spread / 2).toFixed(decimals))

  cache.set(s, { bid, ask, time: Date.now() })

  return { bid, ask, spread: Number(spread.toFixed(5)), mid: midPrice, source: "simulated" }
}
