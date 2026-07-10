import { supabaseAdmin } from "./supabase/admin"

type NotificationType = "trade_copied" | "subscription_expiring" | "subscription_expired" | "trade_closed" | "system"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
}: CreateNotificationParams): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
    })

    if (error) {
      console.error("Failed to create notification:", error.message)
      return false
    }
    return true
  } catch (err) {
    console.error("Notification error:", err)
    return false
  }
}

export async function notifyTradeCopied(
  followerId: string,
  masterName: string,
  symbol: string,
  type: string,
  volume: number,
  tradeId: string
): Promise<boolean> {
  return createNotification({
    userId: followerId,
    type: "trade_copied",
    title: "Trade Copied",
    message: `${masterName} opened a ${type.toUpperCase()} ${symbol} trade (${volume} lots) that was copied to your account.`,
    metadata: { masterName, symbol, tradeType: type, volume, tradeId },
  })
}

export async function notifySubscriptionExpiring(
  userId: string,
  masterName: string,
  daysRemaining: number
): Promise<boolean> {
  return createNotification({
    userId,
    type: "subscription_expiring",
    title: "Subscription Expiring Soon",
    message: `Your copy trading subscription with ${masterName} will expire in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}.`,
    metadata: { masterName, daysRemaining },
  })
}

export async function notifySubscriptionExpired(
  userId: string,
  masterName: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: "subscription_expired",
    title: "Subscription Expired",
    message: `Your copy trading subscription with ${masterName} has expired. No new trades will be copied.`,
    metadata: { masterName },
  })
}

export async function checkAndNotifyExpiringSubscriptions(): Promise<number> {
  const MIN_ACTIVE_DAYS = 5
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const { data: subscriptions, error } = await supabaseAdmin
    .from("copy_trade_subscriptions")
    .select("id, follower_id, started_at, master_trader:master_traders!inner(display_name)")
    .eq("status", "active")

  if (error || !subscriptions) {
    console.error("Failed to fetch subscriptions for expiry check:", error?.message)
    return 0
  }

  let notifiedCount = 0

  // Batch fetch all today's expiry notifications to avoid N+1
  const { data: existingNotifs } = await supabaseAdmin
    .from("notifications")
    .select("user_id")
    .in("type", ["subscription_expiring", "subscription_expired"])
    .gte("created_at", todayStart)

  const notifiedToday = new Set((existingNotifs || []).map((n) => n.user_id))

  for (const sub of subscriptions) {
    const daysActive = (Date.now() - new Date(sub.started_at).getTime()) / (1000 * 60 * 60 * 24)
    const daysRemaining = Math.ceil(MIN_ACTIVE_DAYS - daysActive)
    const masterName = (sub.master_trader as any)?.display_name || "Unknown"

    // Skip if already notified today
    if (notifiedToday.has(sub.follower_id)) continue

    if (daysRemaining <= 1 && daysRemaining > 0) {
      const created = await notifySubscriptionExpiring(sub.follower_id, masterName, daysRemaining)
      if (created) notifiedCount++
    } else if (daysRemaining <= 0) {
      const created = await notifySubscriptionExpired(sub.follower_id, masterName)
      if (created) notifiedCount++
    }
  }

  return notifiedCount
}
