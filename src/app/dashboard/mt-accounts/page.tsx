"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Terminal, Plus, Trash2, Star, Check, X, Copy } from "lucide-react"

type MtAccount = {
  id: string
  login_id: string
  platform: "mt4" | "mt5"
  account_type: "demo" | "real"
  server: string
  broker: string | null
  balance: number
  equity: number
  leverage: string
  status: string
  is_default: boolean
  created_at: string
}

export default function MtAccountsPage() {
  const [accounts, setAccounts] = useState<MtAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showLink, setShowLink] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const [linkForm, setLinkForm] = useState({ login_id: "", platform: "mt4", server: "", broker: "", account_type: "real", investor_password: "" })
  const [demoForm, setDemoForm] = useState({ platform: "mt4", leverage: "1:100" })

  const [error, setError] = useState("")
  const [demoResult, setDemoResult] = useState<any>(null)

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/mt/accounts")
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAccounts() }, [])

  async function handleLink(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch("/api/mt/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowLink(false)
      setLinkForm({ login_id: "", platform: "mt4", server: "", broker: "", account_type: "real", investor_password: "" })
      fetchAccounts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleCreateDemo(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setDemoResult(null)
    try {
      const res = await fetch("/api/mt/accounts/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDemoResult(data)
      setShowDemo(false)
      fetchAccounts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await fetch(`/api/mt/accounts/${id}`, { method: "DELETE" })
      fetchAccounts()
    } catch {}
  }

  async function handleSetDefault(id: string) {
    try {
      await fetch(`/api/mt/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      })
      fetchAccounts()
    } catch {}
  }

  async function copyPassword(text: string) {
    await navigator.clipboard.writeText(text)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Trading Accounts</h1>
          <p className="text-sm text-[#A0A0B0] mt-1">Manage your trading accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowDemo(!showDemo); setShowLink(false); setDemoResult(null); setError("") }}
            className="px-4 py-2 rounded-xl bg-[#D4A843]/10 text-[#D4A843] text-sm font-medium hover:bg-[#D4A843]/20 flex items-center gap-2"
          >
            <Terminal size={16} /> Demo Account
          </button>
          <button
            onClick={() => { setShowLink(!showLink); setShowDemo(false); setDemoResult(null); setError("") }}
            className="px-4 py-2 rounded-xl bg-[#2196F3]/10 text-[#2196F3] text-sm font-medium hover:bg-[#2196F3]/20 flex items-center gap-2"
          >
            <Plus size={16} /> Link Account
          </button>
        </div>
      </div>

      {(showLink || showDemo || demoResult) && (
        <Card className="p-6 mb-6 max-w-lg">
          {showDemo && !demoResult && (
            <form onSubmit={handleCreateDemo} className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F5F5F5]">Create Demo Account</h3>
              <p className="text-sm text-[#A0A0B0]">Get a $500 virtual trading account</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#A0A0B0] block mb-1">Account Type</label>
                  <select
                    value={demoForm.platform}
                    onChange={(e) => setDemoForm({ ...demoForm, platform: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                  >
                    <option value="mt4">Standard</option>
                    <option value="mt5">ECN</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#A0A0B0] block mb-1">Leverage</label>
                  <select
                    value={demoForm.leverage}
                    onChange={(e) => setDemoForm({ ...demoForm, leverage: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                  >
                    {["1:10", "1:30", "1:50", "1:100", "1:200", "1:500", "1:1000", "1:2000"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              {error && <div className="p-3 rounded-xl bg-[#FF1744]/10 text-sm text-[#FF1744]">{error}</div>}
              <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] font-semibold text-sm hover:opacity-90">
                Create Demo Account
              </button>
            </form>
          )}

          {demoResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 text-center">
                <div className="text-lg font-bold text-[#00C853]">Demo Account Created!</div>
                <p className="text-sm text-[#A0A0B0] mt-1">Use these credentials to log in</p>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-[#0A0B0F] border border-white/10">
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">Server</span><span className="text-[#F5F5F5]">{demoResult.server}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">Login</span><span className="text-[#F5F5F5] font-mono">{demoResult.login_id}</span></div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-[#A0A0B0]">Password</span>
                  <span className="text-[#F5F5F5] font-mono flex items-center gap-2">
                    {demoResult.password}
                    <button onClick={() => copyPassword(demoResult.password)} className="p-1 hover:text-[#D4A843]"><Copy size={14} /></button>
                  </span>
                </div>
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">Balance</span><span className="text-[#00C853]">${Number(demoResult.balance).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#A0A0B0]">Leverage</span><span className="text-[#F5F5F5]">{demoResult.leverage}</span></div>
              </div>
              <button
                onClick={() => setDemoResult(null)}
                className="w-full py-3 rounded-xl bg-white/5 text-[#A0A0B0] text-sm font-medium hover:bg-white/10"
              >
                Dismiss
              </button>
            </div>
          )}

          {showLink && (
            <form onSubmit={handleLink} className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F5F5F5]">Link Real Account</h3>
              <p className="text-sm text-[#A0A0B0]">Connect your existing trading account</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#A0A0B0] block mb-1">Login ID</label>
                  <input
                    type="text" value={linkForm.login_id}
                    onChange={(e) => setLinkForm({ ...linkForm, login_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#A0A0B0] block mb-1">Account Type</label>
                  <select
                    value={linkForm.platform}
                    onChange={(e) => setLinkForm({ ...linkForm, platform: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                  >
                    <option value="mt4">Standard</option>
                    <option value="mt5">ECN</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#A0A0B0] block mb-1">Server</label>
                  <input
                    type="text" value={linkForm.server}
                    onChange={(e) => setLinkForm({ ...linkForm, server: e.target.value })}
                    placeholder="e.g. ICMarkets-Demo"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#A0A0B0] block mb-1">Type</label>
                  <select
                    value={linkForm.account_type}
                    onChange={(e) => setLinkForm({ ...linkForm, account_type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                  >
                    <option value="real">Real</option>
                    <option value="demo">Demo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1">Broker Name (optional)</label>
                <input
                  type="text" value={linkForm.broker}
                  onChange={(e) => setLinkForm({ ...linkForm, broker: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#A0A0B0] block mb-1">Investor Password (optional)</label>
                <input
                  type="password" value={linkForm.investor_password}
                  onChange={(e) => setLinkForm({ ...linkForm, investor_password: e.target.value })}
                  placeholder="Read-only password for trade copying"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm"
                />
              </div>
              {error && <div className="p-3 rounded-xl bg-[#FF1744]/10 text-sm text-[#FF1744]">{error}</div>}
              <button type="submit" className="w-full py-3 rounded-xl bg-[#2196F3] text-white font-semibold text-sm hover:opacity-90">
                Link Account
              </button>
            </form>
          )}
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16">
          <Terminal size={48} className="text-[#D4A843] mx-auto mb-3 opacity-50" />
          <p className="text-sm text-[#A0A0B0]">No trading accounts linked</p>
          <p className="text-xs text-[#A0A0B0] mt-1">Create a demo account or link an existing account</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts.map((acc) => (
            <Card key={acc.id} className={`p-5 ${acc.is_default ? "border-[#D4A843]/40" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-[#D4A843]/15 text-[#D4A843]">
                    {acc.platform === "mt4" ? "SD" : "EC"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-[#F5F5F5]">{acc.login_id}</span>
                      {acc.is_default && <Star size={14} className="text-[#D4A843]" />}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        acc.account_type === "demo" ? "bg-[#D4A843]/10 text-[#D4A843]" : "bg-[#00C853]/10 text-[#00C853]"
                      }`}>
                        {acc.account_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        acc.status === "connected" ? "bg-[#00C853]/10 text-[#00C853]" : "bg-[#A0A0B0]/10 text-[#A0A0B0]"
                      }`}>
                        {acc.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#2196F3]/10 text-[#2196F3]">
                        {acc.platform === "mt4" ? "Standard" : "ECN"}
                      </span>
                    </div>
                    <div className="text-xs text-[#A0A0B0] mt-1">{acc.server}{acc.broker ? ` · ${acc.broker}` : ""}</div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-[#A0A0B0]">Balance: <span className="text-[#F5F5F5]">${Number(acc.balance).toLocaleString()}</span></span>
                      <span className="text-[#A0A0B0]">Equity: <span className="text-[#F5F5F5]">${Number(acc.equity).toLocaleString()}</span></span>
                      <span className="text-[#A0A0B0]">Leverage: <span className="text-[#F5F5F5]">{acc.leverage}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!acc.is_default && (
                    <button
                      onClick={() => handleSetDefault(acc.id)}
                      className="p-2 rounded-lg hover:bg-white/5 text-[#A0A0B0] hover:text-[#D4A843]"
                      title="Set as default"
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDisconnect(acc.id)}
                    className="p-2 rounded-lg hover:bg-[#FF1744]/10 text-[#A0A0B0] hover:text-[#FF1744]"
                    title="Disconnect"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
