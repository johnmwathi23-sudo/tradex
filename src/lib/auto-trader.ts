import { supabaseAdmin } from "./supabase/admin"
import { getRealTimePrice } from "./prices"
import type { TradeSignal } from "./ai-analyst"

const ALPHA_TRADER_MASTER_NAME = "AlphaTrader"

async function getAlphaTrader() {
  const { data } = await supabaseAdmin
    .from("master_traders")
    .select("*, profiles!inner(id, email)")
    .eq("display_name", ALPHA_TRADER_MASTER_NAME)
    .eq("is_active", true)
    .single()

  return data || null
}

async function getAlphaTraderMTAccount(userId: string) {
  const { data } = await supabaseAdmin
    .from("mt_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("account_type", "demo")
    .eq("status", "connected")
    .order("is_default", { ascending: false })
    .limit(1)
    .single()

  return data || null
}

export async function executeSignal(signalId: string): Promise<{ success: boolean; error?: string; tradeId?: string; copiedTo?: number }> {
  const { data: signal } = await supabaseAdmin
    .from("ai_trading_signals")
    .select("*")
    .eq("id", signalId)
    .eq("status", "pending")
    .single()

  if (!signal) return { success: false, error: "Signal not found or already executed" }

  const master = await getAlphaTrader()
  if (!master) return { success: false, error: "AlphaTrader master not found or inactive" }

  const mtAccount = await getAlphaTraderMTAccount(master.user_id)
  if (!mtAccount) return { success: false, error: "AlphaTrader has no demo MT account" }

  const price = await getRealTimePrice(signal.symbol)
  if (!price) return { success: false, error: `Cannot get price for ${signal.symbol}` }

  const entryPrice = signal.direction === "buy" ? price.ask : price.bid

  if (entryPrice < Number(signal.entry_price_min) || entryPrice > Number(signal.entry_price_max)) {
    return {
      success: false,
      error: `Current ${signal.direction === "buy" ? "ask" : "bid"} ${entryPrice} is outside entry range (${signal.entry_price_min}-${signal.entry_price_max})`,
    }
  }

  const volume = 0.1

  const { data: trade, error: tradeErr } = await supabaseAdmin
    .from("trades")
    .insert({
      user_id: master.user_id,
      account_id: mtAccount.id,
      symbol: signal.symbol,
      type: signal.direction,
      volume,
      open_price: entryPrice,
      stop_loss: signal.stop_loss,
      take_profit: signal.take_profit,
      status: "open",
      is_ai_generated: true,
      signal_id: signal.id,
    })
    .select()
    .single()

  if (tradeErr || !trade) {
    return { success: false, error: tradeErr?.message || "Failed to create trade" }
  }

  await supabaseAdmin
    .from("ai_trading_signals")
    .update({ status: "executed", executed_at: new Date().toISOString(), trade_id: trade.id })
    .eq("id", signal.id)

  await supabaseAdmin
    .from("master_traders")
    .update({ total_trades: (master.total_trades || 0) + 1 })
    .eq("id", master.id)

  const copiedTo = await copyTradeToFollowers(trade.id, master.id, signal)

  return { success: true, tradeId: trade.id, copiedTo }
}

async function copyTradeToFollowers(tradeId: string, masterTraderId: string, signal: any): Promise<number> {
  const { data: subscriptions } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .select("*, profiles!inner(id)")
    .eq("master_trader_id", masterTraderId)
    .eq("status", "active")

  if (!subscriptions || subscriptions.length === 0) return 0

  const masterTrade = await supabaseAdmin.from("trades").select("*").eq("id", tradeId).single()
  if (!masterTrade.data) return 0

  let copiedCount = 0

  for (const sub of subscriptions) {
    const { data: followerMT } = await supabaseAdmin
      .from("mt_accounts")
      .select("*")
      .eq("user_id", sub.follower_id)
      .eq("account_type", "demo")
      .eq("status", "connected")
      .order("is_default", { ascending: false })
      .limit(1)
      .single()

    if (!followerMT) continue

    const allocationFactor = (sub.allocation_percentage || 100) / 100
    const followerVolume = Math.max(0.01, masterTrade.data.volume * allocationFactor)

    await supabaseAdmin.from("trades").insert({
      user_id: sub.follower_id,
      account_id: followerMT.id,
      master_trade_id: masterTrade.data.id,
      symbol: masterTrade.data.symbol,
      type: masterTrade.data.type,
      volume: followerVolume,
      open_price: masterTrade.data.open_price,
      stop_loss: masterTrade.data.stop_loss,
      take_profit: masterTrade.data.take_profit,
      status: "open",
      is_ai_generated: true,
      signal_id: signal.id,
    })
    copiedCount++
  }

  return copiedCount
}
