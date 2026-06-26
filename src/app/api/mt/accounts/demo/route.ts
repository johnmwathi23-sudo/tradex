import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const demoAccounts: Record<string, { server: string; broker: string }> = {
  mt4: { server: "Primestone-Demo", broker: "Primestone Global Markets" },
  mt5: { server: "Primestone-Demo5", broker: "Primestone Global Markets" },
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { platform, leverage } = await req.json()
  if (!platform || !["mt4", "mt5"].includes(platform)) {
    return NextResponse.json({ error: "Platform must be mt4 or mt5" }, { status: 400 })
  }

  const demoLogin = `${1000000 + Math.floor(Math.random() * 9000000)}`
  const demoPassword = `Demo${Math.random().toString(36).slice(2, 10)}`
  const demoServer = demoAccounts[platform].server
  const balance = 500.00

  const { data, error } = await supabase
    .from("mt_accounts")
    .insert({
      user_id: user.id,
      login_id: demoLogin,
      platform,
      server: demoServer,
      broker: demoAccounts[platform].broker,
      account_type: "demo",
      investor_password: demoPassword,
      account_currency: "USD",
      balance,
      equity: balance,
      leverage: leverage || "1:100",
      status: "connected",
      is_default: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data) return NextResponse.json({ error: "No data returned" }, { status: 500 })

  return NextResponse.json({
    ...data,
    password: demoPassword,
    message: "Demo account created successfully",
  }, { status: 201 })
}
