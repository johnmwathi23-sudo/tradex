import { supabaseAdmin } from "@/lib/supabase/admin"
import { placeMarketBuyOrder } from "@/lib/okx/trade"
import { withdrawUSDT } from "@/lib/okx/wallet"

function createAudit(entry: {
  payment_id?: string
  conversion_job_id?: string
  event_type: string
  status_from?: string
  status_to?: string
  metadata?: Record<string, unknown>
}) {
  return supabaseAdmin.from("audit_logs").insert(entry)
}

export async function processConversionJobs() {
  const { data: jobs, error } = await supabaseAdmin
    .from("conversion_jobs")
    .select(`
      id,
      usdt_amount,
      retry_count,
      max_retries,
      error_log,
      payment_id,
      payments!inner (id)
    `)
    .eq("status", "queued")
    .lt("retry_count", 3)
    .limit(5)

  if (error || !jobs?.length) return { processed: 0 }

  let processed = 0

  for (const job of jobs as any[]) {
    try {
      await supabaseAdmin
        .from("conversion_jobs")
        .update({ status: "converting", updated_at: new Date().toISOString() })
        .eq("id", job.id)

      await createAudit({
        conversion_job_id: job.id,
        payment_id: job.payment_id,
        event_type: "conversion_started",
        status_from: "queued",
        status_to: "converting",
      })

      const trade = await placeMarketBuyOrder(Number(job.usdt_amount))

      await supabaseAdmin
        .from("conversion_jobs")
        .update({
          status: "completed",
          okx_order_id: trade.orderId,
          okx_fill_price: trade.fillPrice,
          executed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)

      await supabaseAdmin
        .from("payments")
        .update({ status: "crypto_received", updated_at: new Date().toISOString() })
        .eq("id", job.payment_id)

      await createAudit({
        conversion_job_id: job.id,
        payment_id: job.payment_id,
        event_type: "conversion_completed",
        status_from: "converting",
        status_to: "completed",
        metadata: { order_id: trade.orderId, fill_price: trade.fillPrice },
      })

      const transfer = await withdrawUSDT(Number(job.usdt_amount))

      const { data: transferRecord } = await supabaseAdmin
        .from("crypto_transfers")
        .insert({
          conversion_job_id: job.id,
          wallet_address: process.env.USDT_WALLET_ADDRESS!,
          blockchain_network: process.env.USDT_WALLET_NETWORK || "TRC20",
          amount_usdt: Number(job.usdt_amount),
          status: "confirmed",
          tx_hash: transfer.txHash,
          wallet_type: "okx",
          confirmed_at: new Date().toISOString(),
        })
        .select()
        .single()

      await supabaseAdmin
        .from("payments")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", job.payment_id)

      await createAudit({
        conversion_job_id: job.id,
        payment_id: job.payment_id,
        event_type: "transfer_completed",
        status_from: "crypto_received",
        status_to: "completed",
        metadata: { tx_hash: transfer.txHash, transfer_id: transferRecord?.id },
      })

      processed++
    } catch (err) {
      const errorMessage = (err as Error).message
      const newRetry = (job.retry_count || 0) + 1
      const errorLog = (job.error_log || []) as string[]
      errorLog.push(errorMessage)

      const isFailed = newRetry >= (job.max_retries || 3)

      await supabaseAdmin
        .from("conversion_jobs")
        .update({
          retry_count: newRetry,
          error_log: JSON.stringify(errorLog),
          status: isFailed ? "failed" : "queued",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)

      if (isFailed) {
        await supabaseAdmin
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", job.payment_id)
      }

      await createAudit({
        conversion_job_id: job.id,
        payment_id: job.payment_id,
        event_type: isFailed ? "conversion_failed" : "conversion_retry",
        status_from: "converting",
        status_to: isFailed ? "failed" : "queued",
        metadata: { error: errorMessage, retry_count: newRetry },
      })
    }
  }

  return { processed }
}
