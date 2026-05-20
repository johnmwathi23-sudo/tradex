import { requireAdmin } from "@/lib/admin-guard"
import { createClient } from "@/lib/supabase/server"
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

  if (status === "completed" && tx.type === "withdrawal") {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", tx.user_id)
      .single()

    if (account && Number(account.balance) >= Number(tx.amount)) {
      await supabase
        .from("accounts")
        .update({ balance: Number(account.balance) - Number(tx.amount) })
        .eq("user_id", tx.user_id)
    }
  }

  if (status === "cancelled" && tx.type === "withdrawal") {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", tx.user_id)
      .single()

    if (account) {
      await supabase
        .from("accounts")
        .update({ balance: Number(account.balance) + Number(tx.amount) })
        .eq("user_id", tx.user_id)
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
