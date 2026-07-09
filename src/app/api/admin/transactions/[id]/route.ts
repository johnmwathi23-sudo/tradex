import { requireAdmin } from "@/lib/admin-guard"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await requireAdmin()
  if (error) return error

  const { status } = await req.json()
  if (!["completed", "failed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: tx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single()

  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

  const amount = Number(tx.amount)

  if (status === "completed" && tx.type === "withdrawal") {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", tx.user_id)
      .maybeSingle()

    if (account && Number(account.balance) >= amount) {
      await supabase
        .from("accounts")
        .update({ balance: Number(account.balance) - amount })
        .eq("user_id", tx.user_id)
    }

    const { data: mtAccounts } = await supabaseAdmin
      .from("mt_accounts")
      .select("id, balance")
      .eq("user_id", tx.user_id)
      .eq("account_type", "real")

    if (mtAccounts) {
      let remaining = amount
      for (const mt of mtAccounts) {
        if (remaining <= 0) break
        const mtBal = Number(mt.balance)
        const deduct = Math.min(remaining, mtBal)
        await supabaseAdmin
          .from("mt_accounts")
          .update({ balance: mtBal - deduct, equity: mtBal - deduct })
          .eq("id", mt.id)
        remaining -= deduct
      }
    }
  }

  if (status === "cancelled" && tx.type === "withdrawal") {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", tx.user_id)
      .maybeSingle()

    if (account) {
      await supabase
        .from("accounts")
        .update({ balance: Number(account.balance) + amount })
        .eq("user_id", tx.user_id)
    }

    const { data: mtAccounts } = await supabaseAdmin
      .from("mt_accounts")
      .select("id, balance")
      .eq("user_id", tx.user_id)
      .eq("account_type", "real")

    if (mtAccounts && mtAccounts.length > 0) {
      const mt = mtAccounts[0]
      const mtBal = Number(mt.balance)
      await supabaseAdmin
        .from("mt_accounts")
        .update({ balance: mtBal + amount, equity: mtBal + amount })
        .eq("id", mt.id)
    }
  }

  const { data, error: updateError } = await supabase
    .from("transactions")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(data)
}
