"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Account Settings</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Personal Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">First Name</label>
              <input type="text" defaultValue="John" className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Last Name</label>
              <input type="text" defaultValue="Doe" className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Email</label>
              <input type="email" defaultValue="john@example.com" className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Phone</label>
              <input type="tel" defaultValue="+254 712 345 678" className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="primary" size="sm">Save Changes</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Security</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Current Password</label>
              <input type="password" placeholder="Enter current password" className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">New Password</label>
                <input type="password" placeholder="Enter new password" className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1.5">Confirm Password</label>
                <input type="password" placeholder="Confirm new password" className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm" />
              </div>
            </div>
            <Button variant="outline" size="sm">Update Password</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">KYC Verification</h3>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#D4A843]/10 border border-[#D4A843]/20">
            <div className="w-8 h-8 rounded-full bg-[#D4A843]/20 flex items-center justify-center text-[#D4A843] text-sm font-bold">!</div>
            <div>
              <div className="text-sm font-medium text-[#D4A843]">Verification Required</div>
              <div className="text-xs text-[#A0A0B0]">Upload your ID and proof of address to unlock full account features</div>
            </div>
            <Button variant="primary" size="sm" className="ml-auto">Upload</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
