"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Check, X, TrendingUp, Plus, UserPlus } from "lucide-react"

type MasterTrader = {
  id: string
  display_name: string
  roi: number
  win_rate: number
  total_followers: number
  is_verified: boolean
  is_active: boolean
  risk_level: string
  created_at: string
  profiles: { email: string; first_name: string; last_name: string }
}

export default function AdminTradersPage() {
  const [traders, setTraders] = useState<MasterTrader[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: "", display_name: "", bio: "", risk_level: "medium" })
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)

  async function fetchTraders() {
    try {
      const res = await fetch("/api/admin/master-traders")
      const data = await res.json()
      setTraders(Array.isArray(data) ? data : [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTraders() }, [])

  async function updateTrader(traderId: string, updates: any) {
    try {
      await fetch(`/api/admin/master-traders/${traderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      fetchTraders()
    } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError("")
    try {
      const res = await fetch("/api/admin/master-traders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowCreate(false)
      setForm({ email: "", display_name: "", bio: "", risk_level: "medium" })
      fetchTraders()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Master Trader Management</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] text-sm font-semibold hover:opacity-90 transition"
        >
          <UserPlus size={16} />
          Add Trader
        </button>
      </div>

      {showCreate && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Create New Master Trader</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#A0A0B0] block mb-1">User Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-sm text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#A0A0B0] block mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="ProTrader"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-sm text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#A0A0B0] block mb-1">Bio</label>
                <input
                  type="text"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="8+ years trading forex..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-sm text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#A0A0B0] block mb-1">Risk Level</label>
                <select
                  value={form.risk_level}
                  onChange={(e) => setForm({ ...form, risk_level: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-sm text-[#F5F5F5] focus:border-[#D4A843]/50 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-[#FF1744]/10 border border-[#FF1744]/20 text-sm text-[#FF1744]">{error}</div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg bg-white/5 text-[#A0A0B0] text-sm hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-6 md:py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {traders.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center text-[#0A0B0F] text-sm font-bold">
                    {t.display_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#F5F5F5]">{t.display_name}</span>
                      {t.is_verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00C853]/20 text-[#00C853]">VERIFIED</span>}
                    </div>
                    <div className="text-xs text-[#A0A0B0]">
                      {t.profiles?.first_name} {t.profiles?.last_name} · {t.profiles?.email}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-[#00C853]">ROI: {t.roi}%</span>
                      <span className="text-[#D4A843]">Win: {t.win_rate}%</span>
                      <span className="text-[#A0A0B0]">Followers: {t.total_followers}</span>
                      <span className="text-[#A0A0B0]">Risk: {t.risk_level}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!t.is_verified && (
                    <button
                      onClick={() => updateTrader(t.id, { is_verified: true })}
                      className="px-3 py-1.5 rounded-lg bg-[#00C853]/10 text-[#00C853] text-xs font-medium hover:bg-[#00C853]/20 flex items-center gap-1"
                    >
                      <Check size={12} /> Verify
                    </button>
                  )}
                  <button
                    onClick={() => updateTrader(t.id, { is_active: !t.is_active })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      t.is_active
                        ? "bg-[#FF1744]/10 text-[#FF1744] hover:bg-[#FF1744]/20"
                        : "bg-[#00C853]/10 text-[#00C853] hover:bg-[#00C853]/20"
                    }`}
                  >
                    {t.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {traders.length === 0 && (
            <div className="text-center py-6 md:py-12">
              <TrendingUp size={40} className="mx-auto mb-3 text-[#A0A0B0] opacity-50" />
              <p className="text-sm text-[#A0A0B0]">No master traders registered yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
