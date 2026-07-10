"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Bell, Check, CheckCircle, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  metadata: Record<string, unknown>
}

type NotificationsResponse = {
  notifications: Notification[]
  unreadCount: number
}

const TYPE_ICONS: Record<string, string> = {
  trade_copied: "📋",
  subscription_expiring: "⏰",
  subscription_expired: "🔔",
  trade_closed: "✅",
  system: "ℹ️",
}

const TYPE_COLORS: Record<string, string> = {
  trade_copied: "#00C853",
  subscription_expiring: "#D4A843",
  subscription_expired: "#FF1744",
  trade_closed: "#00C853",
  system: "#A0A0B0",
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data: NotificationsResponse = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  async function markAsRead(ids: string[]) {
    setMarkingRead(true)
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: ids }),
      })
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - ids.length))
    } catch {
      // silent fail
    } finally {
      setMarkingRead(false)
    }
  }

  async function markAllRead() {
    setMarkingRead(true)
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // silent fail
    } finally {
      setMarkingRead(false)
    }
  }

  async function deleteNotification(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (!notifications.find((n) => n.id === id)?.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      // silent fail
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg bg-[#0A0B0F] border border-white/10 flex items-center justify-center text-[#A0A0B0] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all duration-200"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#FF1744] text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[500px] rounded-xl bg-[#12141D] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#F5F5F5]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#FF1744]/20 text-[#FF1744] text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#D4A843] hover:bg-[#D4A843]/10 transition disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCircle size={12} />
                  Read all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#A0A0B0] hover:text-[#F5F5F5] hover:bg-white/5 transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="text-[#A0A0B0] mx-auto mb-2 opacity-30" />
                <p className="text-sm text-[#A0A0B0]">No notifications yet</p>
                <p className="text-xs text-[#A0A0B0]/60 mt-1">
                  You&apos;ll be alerted when trades are copied
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.02] group",
                      !n.is_read && "bg-[#D4A843]/[0.03]"
                    )}
                    onClick={() => !n.is_read && markAsRead([n.id])}
                  >
                    <div className="shrink-0 mt-0.5">
                      <span className="text-lg">{TYPE_ICONS[n.type] || "ℹ️"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-xs font-medium", n.is_read ? "text-[#A0A0B0]" : "text-[#F5F5F5]")}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[n.type] || "#A0A0B0" }}
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-[#A0A0B0] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-[#A0A0B0]/60 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                      {!n.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead([n.id])
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#00C853] hover:bg-[#00C853]/10 transition"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(n.id)
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#FF1744] hover:bg-[#FF1744]/10 transition"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
