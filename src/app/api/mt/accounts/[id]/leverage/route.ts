import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { leverage } = await req.json()
  if (!leverage) return NextResponse.json({ error: "Leverage is required" }, { status: 400 })

  const { data: account } = await supabase
    .from("mt_accounts")
    .select("user_id, account_type")
    .eq("id", id)
    .single()

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })
  if (account.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (account.account_type !== "demo") return NextResponse.json({ error: "Only demo accounts can change leverage" }, { status: 400 })

  const { data, error } = await supabase
    .from("mt_accounts")
    .update({ leverage })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
