"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const phone = formData.get("phone") as string

  if (!email || !password || !firstName || !lastName) {
    return { error: "All required fields must be filled" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
      },
    },
  })

  if (error) {
    // Show a friendlier message for rate limit errors
    if (error.message.includes("rate") || error.message.includes("limit")) {
      return { error: "Too many signup attempts. Please wait a few minutes and try again." }
    }
    return { error: error.message }
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
    }
  }

  // If email confirmation is required, session will be null
  if (data.session) {
    revalidatePath("/", "layout")
    redirect("/dashboard")
  } else {
    return { success: "Account created! Please check your email to verify your account." }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
