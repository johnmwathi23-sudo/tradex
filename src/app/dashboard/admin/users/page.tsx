"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  kyc_status: string
  role: string
  created_at: string
  accounts: any[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users")
      setUsers(Array.isArray(await res.json()) ? await res.json() : [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  async function updateKyc(userId: string, status: string) {
    try {
      await fetch(`/api/admin/users/${userId}/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_status: status }),
      })
      fetchUsers()
    } catch {}
  }

  const badgeColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-[#00C853]/10 text-[#00C853]"
      case "rejected": return "bg-[#FF1744]/10 text-[#FF1744]"
      case "submitted": return "bg-[#D4A843]/10 text-[#D4A843]"
      default: return "bg-[#A0A0B0]/10 text-[#A0A0B0]"
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">User Management</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-[#0A0B0F] text-sm font-bold">
                    {(u.first_name?.[0] || u.email?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#F5F5F5]">
                      {u.first_name} {u.last_name}
                      {u.role === "admin" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#D4A843]/20 text-[#D4A843]">ADMIN</span>}
                    </div>
                    <div className="text-xs text-[#A0A0B0]">{u.email} · {u.phone || "No phone"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor(u.kyc_status)}`}>
                    {u.kyc_status}
                  </span>
                  {u.kyc_status === "submitted" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateKyc(u.id, "approved")}
                        className="p-1.5 rounded-lg bg-[#00C853]/10 text-[#00C853] hover:bg-[#00C853]/20"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => updateKyc(u.id, "rejected")}
                        className="p-1.5 rounded-lg bg-[#FF1744]/10 text-[#FF1744] hover:bg-[#FF1744]/20"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
