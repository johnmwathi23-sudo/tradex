import { okxClient } from "./client"

interface OKXOrderResponse {
  ordId: string
  clOrdId: string
  fillPx: string
  fillSz: string
  state: string
}

export async function placeMarketBuyOrder(usdtAmount: number): Promise<{
  orderId: string
  fillPrice: number
  filledAmount: number
}> {
  const data = await okxClient.post<OKXOrderResponse[]>("/api/v5/trade/order", {
    instId: "USDT-USDC",
    tdMode: "cash",
    side: "buy",
    ordType: "market",
    sz: usdtAmount.toFixed(6),
    tgtCcy: "USDT",
  })

  const order = data[0]

  return {
    orderId: order.ordId,
    fillPrice: Number.parseFloat(order.fillPx || "0"),
    filledAmount: Number.parseFloat(order.fillSz || "0"),
  }
}
