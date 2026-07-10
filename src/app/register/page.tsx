"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
        },
      },
    })

    if (authError) {
      // Show a friendlier message for rate limit errors
      if (authError.message.includes("rate") || authError.message.includes("limit")) {
        setError("Too many signup attempts. Please wait a few minutes and try again.")
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
      }, { onConflict: "id" })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        showToast("Account created but profile setup had an issue. Please contact support if you see errors.", "error")
      }
    }

    // If email confirmation is enabled, data.session will be null
    // Show a message instead of redirecting to dashboard
    if (data.session) {
      // Auto-confirmed (email confirmation disabled) — go to dashboard
      router.push("/dashboard")
      router.refresh()
    } else {
      // Email confirmation required — show info message
      showToast("Account created! Please check your email to verify your account.", "success")
      setLoading(false)
    }
  }

  return (
    <div className="pt-20 pb-12 md:pt-32 md:pb-24">
      <div className="max-w-md mx-auto px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#F5F5F5]">Create Your Account</h1>
            <p className="text-sm text-[#A0A0B0] mt-2">Start trading in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20 text-sm text-[#FF1744]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="John"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Doe"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Create a strong password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>

            <Button variant="primary" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#A0A0B0] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#D4A843] hover:underline font-medium">Log In</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
