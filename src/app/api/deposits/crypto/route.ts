import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const cryptoWallets: Record<string, string> = {
  USDT_TRC20: "TX7LdRq4xq4pMkPxq4pMkPxq4pMkPxq4pMkP",
  USDT_ERC20: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  BTC: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount, asset } = await req.json()
  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Invalid amount (min $10)" }, { status: 400 })
  }
  if (!asset || !cryptoWallets[asset]) {
    return NextResponse.json({ error: "Unsupported asset" }, { status: 400 })
  }

  const ref = `CRYPTO_${asset}_${Date.now()}_${user.id.slice(0, 4)}`

  const { data: tx } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "deposit",
      method: asset === "BTC" ? "crypto_btc" : "crypto_usdt",
      amount,
      currency: "USD",
      status: "pending",
      reference: ref,
      description: `${asset} deposit`,
    })
    .select()
    .single()

  return NextResponse.json({
    success: true,
    transactionId: tx.id,
    reference: ref,
    walletAddress: cryptoWallets[asset],
    asset,
    amount,
    instructions: `Send exactly ${amount} USD worth of ${asset} to the address above. Your account will be credited after 2 confirmations.`,
  })
}
