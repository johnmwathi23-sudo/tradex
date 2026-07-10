import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { checkAndNotifyExpiringSubscriptions } from "@/lib/notifications"

// This endpoint is designed to be called by a cron job or admin
// It uses the service role client directly
export async function POST() {
  try {
    const notified = await checkAndNotifyExpiringSubscriptions()
    return NextResponse.json({ success: true, notified })
  } catch (error) {
    console.error("Expiry check error:", error)
    return NextResponse.json({ error: "Failed to check expiry" }, { status: 500 })
  }
}
