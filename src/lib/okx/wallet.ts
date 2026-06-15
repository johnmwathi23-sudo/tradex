import { okxClient } from "./client"

const WALLET_ADDRESS = process.env.USDT_WALLET_ADDRESS!
const WALLET_NETWORK = process.env.USDT_WALLET_NETWORK || "TRC20"

interface OKXWithdrawalResponse {
  wdId: string
  txId: string
  state: string
}

export async function withdrawUSDT(amount: number): Promise<{
  withdrawalId: string
  txHash: string
}> {
  if (!WALLET_ADDRESS) {
    throw new Error("USDT_WALLET_ADDRESS not configured")
  }

  const data = await okxClient.post<OKXWithdrawalResponse[]>("/api/v5/asset/withdrawal", {
    ccy: "USDT",
    amt: amount.toFixed(6),
    dest: "4",
    toAddr: WALLET_ADDRESS,
    chain: `USDT-${WALLET_NETWORK}`,
    fee: "0",
  })

  const result = data[0]

  return {
    withdrawalId: result.wdId,
    txHash: result.txId,
  }
}
