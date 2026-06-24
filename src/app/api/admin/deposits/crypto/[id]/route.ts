import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { action } = await req.json()

  if (!["confirmed", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Action must be 'confirmed' or 'rejected'" }, { status: 400 })
  }

  const { data: tx, error: fetchError } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  if (tx.status !== "pending") return NextResponse.json({ error: "Transaction already processed" }, { status: 400 })

  const now = new Date().toISOString()

  if (action === "confirmed") {
    const { error: updateError } = await supabaseAdmin
      .from("transactions")
      .update({ status: "completed", updated_at: now })
      .eq("id", id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("id, balance")
      .eq("user_id", tx.user_id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .single()

    if (!account) return NextResponse.json({ error: "User has no active account" }, { status: 500 })

    const { error: balanceError } = await supabaseAdmin
      .from("accounts")
      .update({ balance: (account.balance || 0) + tx.amount })
      .eq("id", account.id)

    if (balanceError) return NextResponse.json({ error: balanceError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  }

  const { error: rejectError } = await supabaseAdmin
    .from("transactions")
    .update({ status: "rejected", updated_at: now })
    .eq("id", id)

  if (rejectError) return NextResponse.json({ error: rejectError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
