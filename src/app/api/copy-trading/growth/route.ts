import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const TREVOR_UID = "813859d1-474f-436d-8762-f04f252e60be"

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export async function POST(req: Request) {
  try {
    const isCron = req.headers.get("x-vercel-cron") === "1"
    const hasSecret = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
    if (!isCron && !hasSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const day = Math.floor(Date.now() / 86400000)
    const r = seededRandom(day)
    const baseReturn = 0.3 + r * 2.0
    const isGreen = seededRandom(day + 100) > 0.15
    const pnlPercent = isGreen ? baseReturn : -baseReturn * 0.5

    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("balance")
      .eq("user_id", TREVOR_UID)
      .single()

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })

    const currentBalance = Number(account.balance)
    const pnlAmount = Number((currentBalance * pnlPercent / 100).toFixed(2))
    const newBalance = Number((currentBalance + pnlAmount).toFixed(2))

    await supabaseAdmin.from("accounts").update({ balance: newBalance, equity: newBalance }).eq("user_id", TREVOR_UID)
    await supabaseAdmin.from("mt_accounts").update({ balance: newBalance, equity: newBalance }).eq("user_id", TREVOR_UID)

    return NextResponse.json({
      day,
      pnlPercent: Number(pnlPercent.toFixed(2)),
      pnlAmount,
      balance: newBalance,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
