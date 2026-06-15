"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Menu, X, LogOut, User, Wallet } from "lucide-react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/account-types", label: "Account Types" },
  { href: "/instruments", label: "Instruments" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setBalance(null); return }
    let cancelled = false
    async function fetchBalance() {
      try {
        const [accountsRes, ordersRes] = await Promise.all([
          fetch("/api/mt/accounts"),
          fetch("/api/mt/orders")
        ])
        if (cancelled) return
        const accounts = await accountsRes.json()
        const orders = await ordersRes.json()
        const list = Array.isArray(accounts) ? accounts : []
        const acct = list.find((a: any) => a.is_default) || list[0]
        if (acct) {
          let totalPnl = 0
          if (Array.isArray(orders)) {
            for (const t of orders) {
              if (t.status === "open") totalPnl += Number(t.unrealized_pnl) || 0
            }
          }
          setBalance(Math.max(Number(acct.balance) + totalPnl, 0))
        } else {
          setBalance(0)
        }
      } catch {}
    }
    fetchBalance()
    const interval = setInterval(fetchBalance, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [user])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0F]/80 backdrop-blur-xl border-b border-white/5 will-change-transform">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/primestone-logo.svg"
              alt="Primestone Markets"
              width={100}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#A0A0B0] hover:text-[#D4A843] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User size={16} className="mr-1.5" />
                    Dashboard
                  </Button>
                </Link>
                {balance != null && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A843]/10 border border-[#D4A843]/20">
                    <Wallet size={14} className="text-[#D4A843]" />
                    <span className="text-sm font-semibold text-[#D4A843]">${balance.toFixed(2)}</span>
                  </div>
                )}
                <button onClick={handleLogout}>
                  <Button variant="outline" size="sm">
                    <LogOut size={16} className="mr-1.5" />
                    Log Out
                  </Button>
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-[#F5F5F5] p-2"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className={cn(
        "lg:hidden transition-all duration-300",
        open ? "max-h-96 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
      )}>
        <div className="px-4 pb-6 pt-2 space-y-3 border-t border-white/5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-[#A0A0B0] hover:text-[#D4A843] transition-colors py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-3">
            {user ? (
              <>
                <Link href="/dashboard" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">Dashboard</Button>
                </Link>
                <button onClick={handleLogout} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Log Out</Button>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Log In</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
