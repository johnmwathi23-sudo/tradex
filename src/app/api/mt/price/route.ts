import { getRealTimePrice } from "@/lib/prices"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.toUpperCase() || "EURUSD"

  const price = await getRealTimePrice(symbol)
  if (!price) return NextResponse.json({ error: "Unknown symbol" }, { status: 400 })

  return NextResponse.json({ symbol, ...price })
}
