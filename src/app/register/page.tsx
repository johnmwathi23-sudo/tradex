"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function RegisterPage() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-md mx-auto px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#F5F5F5]">Create Your Account</h1>
            <p className="text-sm text-[#A0A0B0] mt-2">Start trading in minutes</p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+254 7XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Create a strong password"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
              />
            </div>

            <Button variant="primary" className="w-full">Create Account</Button>
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
