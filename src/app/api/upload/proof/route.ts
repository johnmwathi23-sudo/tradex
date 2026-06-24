import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split(".").pop() || "png"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("deposit-proofs")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      if (uploadError.message.includes("bucket")) {
        await supabaseAdmin.storage.createBucket("deposit-proofs", {
          public: true,
        })
        const { error: retryError } = await supabaseAdmin.storage
          .from("deposit-proofs")
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          })
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("deposit-proofs")
      .getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
