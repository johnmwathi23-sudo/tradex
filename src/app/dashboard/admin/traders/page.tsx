"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Check, X, TrendingUp } from "lucide-react"

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Master Trader Management</h1>
      {loading ? (
        <div className="flex justify-center py-12">
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
            <div className="text-center py-12">
              <TrendingUp size={40} className="mx-auto mb-3 text-[#A0A0B0] opacity-50" />
              <p className="text-sm text-[#A0A0B0]">No master traders registered yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
