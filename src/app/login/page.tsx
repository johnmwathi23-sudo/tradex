"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="pt-20 pb-12 md:pt-32 md:pb-24">
      <div className="max-w-md mx-auto px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#F5F5F5]">Welcome Back</h1>
            <p className="text-sm text-[#A0A0B0] mt-2">Log in to your Primestone Markets account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/20 text-sm text-[#FF1744]">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#A0A0B0]">
                <input type="checkbox" className="rounded bg-[#0A0B0F] border-white/10" />
                Remember me
              </label>
              <Link href="#" className="text-[#D4A843] hover:underline">Forgot password?</Link>
            </div>

            <Button variant="primary" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#A0A0B0] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#D4A843] hover:underline font-medium">Sign Up</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
