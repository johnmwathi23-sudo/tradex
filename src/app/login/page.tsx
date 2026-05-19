"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-md mx-auto px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#F5F5F5]">Welcome Back</h1>
            <p className="text-sm text-[#A0A0B0] mt-2">Log in to your TradeX account</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
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

            <Button variant="primary" className="w-full">Log In</Button>
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
