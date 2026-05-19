import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: account } = await supabase
    .from("mt_accounts")
    .select("user_id, is_default")
    .eq("id", id)
    .single()

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })
  if (account.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await supabase.from("mt_accounts").delete().eq("id", id)

  if (account.is_default) {
    const { data: nextAccount } = await supabase
      .from("mt_accounts")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (nextAccount) {
      await supabase.from("mt_accounts").update({ is_default: true }).eq("id", nextAccount.id)
    }
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: account } = await supabase
    .from("mt_accounts")
    .select("user_id")
    .eq("id", id)
    .single()

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })
  if (account.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()

  if (body.is_default === true) {
    await supabase.from("mt_accounts").update({ is_default: false }).eq("user_id", user.id)
  }

  const { data, error } = await supabase
    .from("mt_accounts")
    .update(body)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
