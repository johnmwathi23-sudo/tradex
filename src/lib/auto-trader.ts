import { supabaseAdmin } from "./supabase/admin"
import { getRealTimePrice } from "./prices"

const ALPHA_TRADER_MASTER_NAME = "AlphaTrader"

async function getMasterByDisplayName(displayName: string) {
  const { data } = await supabaseAdmin
    .from("master_traders")
    .select("*, profiles!inner(id, email)")
    .eq("display_name", displayName)
    .eq("is_active", true)
    .single()
  return data || null
}

async function getMasterById(masterId: string) {
  const { data } = await supabaseAdmin
    .from("master_traders")
    .select("*, profiles!inner(id, email)")
    .eq("id", masterId)
    .eq("is_active", true)
    .single()
  return data || null
}

async function getTraderMTAccount(userId: string) {
  const { data } = await supabaseAdmin
    .from("mt_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "connected")
    .order("is_default", { ascending: false })
    .limit(1)
    .single()
  return data || null
}

export async function executeSignal(
  signalId: string,
  masterTraderId?: string
): Promise<{ success: boolean; error?: string; tradeId?: string; copiedTo?: number }> {
  const { data: signal } = await supabaseAdmin
    .from("ai_trading_signals")
    .select("*")
    .eq("id", signalId)
    .eq("status", "pending")
    .single()

  if (!signal) return { success: false, error: "Signal not found or already executed" }

  let master
  if (masterTraderId) {
    master = await getMasterById(masterTraderId)
  } else {
    master = await getMasterByDisplayName(ALPHA_TRADER_MASTER_NAME)
  }
  if (!master) return { success: false, error: "Master trader not found or inactive" }

  const mtAccount = await getTraderMTAccount(master.user_id)
  if (!mtAccount) return { success: false, error: "Master trader has no connected MT account" }

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

export async function copyTradeToFollowers(tradeId: string, masterTraderId: string, signal?: { id: string }): Promise<number> {
  const { data: subscriptions } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .select("*")
    .eq("master_trader_id", masterTraderId)
    .eq("status", "active")

  if (!subscriptions || subscriptions.length === 0) return 0

  const { data: masterTrade } = await supabaseAdmin
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .single()

  if (!masterTrade) return 0

  let copiedCount = 0

  for (const sub of subscriptions) {
    const followerMT = await getTraderMTAccount(sub.follower_id)
    if (!followerMT) continue

    if (sub.max_drawdown != null && sub.max_drawdown < 100) {
      const isOverDrawdown = await isFollowerOverMaxDrawdown(sub.follower_id, sub.max_drawdown)
      if (isOverDrawdown) continue
    }

    if (sub.allocated_amount > 0 && followerMT.balance != null) {
      const currentAllocated = await getCurrentAllocatedToMaster(sub.follower_id, masterTraderId)
      if (currentAllocated >= sub.allocated_amount) continue
    }

    const allocationFactor = (sub.allocation_percentage || 100) / 100
    const followerVolume = Math.max(0.01, masterTrade.volume * allocationFactor)

    await supabaseAdmin.from("trades").insert({
      user_id: sub.follower_id,
      account_id: followerMT.id,
      master_trade_id: masterTrade.id,
      symbol: masterTrade.symbol,
      type: masterTrade.type,
      volume: followerVolume,
      open_price: masterTrade.open_price,
      stop_loss: masterTrade.stop_loss,
      take_profit: masterTrade.take_profit,
      status: "open",
      is_ai_generated: !!signal,
      ...(signal ? { signal_id: signal.id } : {}),
    })
    copiedCount++
  }

  return copiedCount
}

async function isFollowerOverMaxDrawdown(followerId: string, maxDrawdown: number): Promise<boolean> {
  const { data: account } = await supabaseAdmin
    .from("mt_accounts")
    .select("balance, equity")
    .eq("user_id", followerId)
    .eq("status", "connected")
    .order("is_default", { ascending: false })
    .limit(1)
    .single()

  if (!account || !account.balance || account.balance <= 0) return false

  const drawdownPercent = ((account.balance - (account.equity ?? account.balance)) / account.balance) * 100
  return drawdownPercent > maxDrawdown
}

async function getCurrentAllocatedToMaster(followerId: string, masterTraderId: string): Promise<number> {
  const { data: master } = await supabaseAdmin
    .from("master_traders")
    .select("user_id")
    .eq("id", masterTraderId)
    .single()

  if (!master) return 0

  const { data: masterTrades } = await supabaseAdmin
    .from("trades")
    .select("id")
    .eq("user_id", master.user_id)
    .eq("status", "open")

  if (!masterTrades || masterTrades.length === 0) return 0

  const masterTradeIds = masterTrades.map((t) => t.id)

  const { data: followerTrades } = await supabaseAdmin
    .from("trades")
    .select("volume, open_price")
    .eq("user_id", followerId)
    .in("master_trade_id", masterTradeIds)
    .eq("status", "open")

  if (!followerTrades || followerTrades.length === 0) return 0

  return followerTrades.reduce((sum, t) => sum + t.volume * t.open_price, 0)
}
