import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 })

  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 })

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and PDF files are allowed" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${user.id}/${Date.now()}.${ext}`

  const bucketName = "kyc-documents"

  const { data: existingBucket } = await supabaseAdmin.storage.getBucket(bucketName)
  if (!existingBucket) {
    await supabaseAdmin.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
    })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabaseAdmin.storage.from(bucketName).upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(fileName)
  const documentUrl = publicUrlData.publicUrl

  const { error: docError } = await supabaseAdmin
    .from("kyc_documents")
    .insert({
      user_id: user.id,
      document_type: "national_id",
      document_url: documentUrl,
      status: "pending",
    })

  if (docError) {
    await supabaseAdmin.storage.from(bucketName).remove([fileName])
    return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ kyc_status: "submitted" })
    .eq("id", user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "KYC document submitted for review" })
}
