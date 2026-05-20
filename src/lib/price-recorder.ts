import { supabaseAdmin } from "./supabase/admin"
import { getRealTimePrice } from "./prices"

const SYMBOLS = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","XAUUSD","BTCUSD","ETHUSD","USOIL","SP500"]

let lastRecord: Record<string, number> = {}

export async function recordPrices(): Promise<void> {
  for (const symbol of SYMBOLS) {
    try {
      const price = await getRealTimePrice(symbol)
      if (!price) continue

      const roundedMid = Math.round(price.mid * 100000)
      if (lastRecord[symbol] === roundedMid) continue
      lastRecord[symbol] = roundedMid

      await supabaseAdmin.from("price_history").insert({
        symbol,
        bid: price.bid,
        ask: price.ask,
        mid: price.mid,
        recorded_at: new Date().toISOString(),
      })
    } catch {
      // silently skip
    }
  }
}
