import { supabaseAdmin } from "@/lib/supabase/admin"
import { generateTradeSignal, getAIMarketSummary } from "@/lib/ai-analyst"
import { fetchFinancialNews } from "@/lib/news"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const isCron = req.headers.get("x-vercel-cron") === "1"
    const hasSecret = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
    if (!isCron && !hasSecret) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const [signal, summary, news] = await Promise.all([
      generateTradeSignal(),
      getAIMarketSummary(),
      fetchFinancialNews(),
    ])

    if (!signal) {
      return NextResponse.json({ success: false, error: "No signal generated" }, { status: 503 })
    }

    const { data, error } = await supabaseAdmin
      .from("ai_trading_signals")
      .insert({
        symbol: signal.symbol,
        direction: signal.direction,
        confidence: signal.confidence,
        entry_price_min: signal.entryPriceMin,
        entry_price_max: signal.entryPriceMax,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
        rationale: signal.rationale,
        timeframe: signal.timeframe,
        news_headlines: news.slice(0, 10).map((n) => n.title),
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, signal: data, summary })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
