"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Check, X, ChevronDown, ChevronUp, FileText, ExternalLink } from "lucide-react"

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

type KycDoc = {
  id: string
  user_id: string
  document_type: string
  document_url: string
  status: string
  admin_notes: string | null
  created_at: string
  profiles: { email: string; first_name: string; last_name: string }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [kycDocs, setKycDocs] = useState<KycDoc[]>([])
  const [kycLoading, setKycLoading] = useState(false)
  const [search, setSearch] = useState("")

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {} finally {
      setLoading(false)
    }
  }

  async function fetchKycDocs() {
    setKycLoading(true)
    try {
      const res = await fetch("/api/admin/kyc-documents")
      const data = await res.json()
      setKycDocs(Array.isArray(data) ? data : [])
    } catch {} finally {
      setKycLoading(false)
    }
  }

  useEffect(() => { fetchUsers(); fetchKycDocs() }, [])

  async function updateKyc(userId: string, status: string) {
    try {
      await fetch(`/api/admin/users/${userId}/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_status: status }),
      })
      fetchUsers()
      fetchKycDocs()
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

  const filtered = search
    ? users.filter((u) =>
        `${u.first_name} ${u.last_name} ${u.email} ${u.phone || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : users

  function userKycDocs(userId: string) {
    return kycDocs.filter((d) => d.user_id === userId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">User Management</h1>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-sm text-[#F5F5F5] w-64 focus:border-[#D4A843]/50 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-6 md:py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => {
            const docs = userKycDocs(u.id)
            const isExpanded = expandedUser === u.id
            return (
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
                      <div className="text-xs text-[#A0A0B0]">{u.email} · {u.phone || "No phone"} · Joined {new Date(u.created_at).toLocaleDateString()}</div>
                      {u.accounts && u.accounts.length > 0 && (
                        <div className="text-xs text-[#A0A0B0]/60 mt-0.5">{u.accounts.length} account{u.accounts.length > 1 ? "s" : ""}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor(u.kyc_status)}`}>
                      {u.kyc_status}
                    </span>
                    {u.kyc_status === "submitted" && (
                      <div className="flex gap-1">
                        <button onClick={() => updateKyc(u.id, "approved")} className="p-1.5 rounded-lg bg-[#00C853]/10 text-[#00C853] hover:bg-[#00C853]/20"><Check size={14} /></button>
                        <button onClick={() => updateKyc(u.id, "rejected")} className="p-1.5 rounded-lg bg-[#FF1744]/10 text-[#FF1744] hover:bg-[#FF1744]/20"><X size={14} /></button>
                      </div>
                    )}
                    {docs.length > 0 && (
                      <button
                        onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                        className="p-1.5 rounded-lg text-[#A0A0B0] hover:text-[#D4A843] hover:bg-white/5"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && docs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <h4 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">KYC Documents</h4>
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0A0B0F]">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-[#D4A843]" />
                          <div>
                            <div className="text-sm text-[#F5F5F5] capitalize">{doc.document_type.replace(/_/g, " ")}</div>
                            <div className="text-xs text-[#A0A0B0]">Submitted {new Date(doc.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor(doc.status)}`}>{doc.status}</span>
                          {doc.document_url && (
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-[#2196F3] hover:bg-[#2196F3]/10">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-6 md:py-12">
              <p className="text-sm text-[#A0A0B0]">{search ? "No users match your search" : "No users registered yet"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
