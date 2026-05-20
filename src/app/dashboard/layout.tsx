"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, TrendingUp, Copy, Briefcase,
  Repeat, Settings, LogOut, Wallet, ArrowDownLeft, Terminal, Shield
} from "lucide-react"
import { useEffect, useState } from "react"

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/trading", label: "Trading", icon: TrendingUp },
  { href: "/dashboard/mt-accounts", label: "MT4/MT5", icon: Terminal },
  { href: "/dashboard/copy-trading", label: "Copy Trading", icon: Copy },
  { href: "/dashboard/deposit", label: "Deposit", icon: ArrowDownLeft },
  { href: "/dashboard/withdrawal", label: "Withdraw", icon: Wallet },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/dashboard/transactions", label: "Transactions", icon: Repeat },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const adminLinks = [
  { href: "/dashboard/admin", label: "Admin Panel", icon: Shield },
  { href: "/dashboard/admin/users", label: "Users", icon: Shield },
  { href: "/dashboard/admin/transactions", label: "Transactions", icon: Shield },
  { href: "/dashboard/admin/traders", label: "Traders", icon: Shield },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.role === "admin"))
  }, [user, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4A843] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const isAdminRoute = pathname.startsWith("/dashboard/admin")

  return (
    <div className="pt-16 min-h-screen flex">
      <aside className="hidden lg:flex w-64 flex-col bg-[#1A1D29]/50 border-r border-white/5 p-4 fixed top-16 bottom-0">
        <div className="text-sm text-[#A0A0B0] px-4 pb-4 mb-4 border-b border-white/5">
          {user.email}
          {isAdmin && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#D4A843]/20 text-[#D4A843]">ADMIN</span>}
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20"
                    : "text-[#A0A0B0] hover:text-[#F5F5F5] hover:bg-white/5"
                )}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="px-4 pt-4 pb-2 text-[10px] font-semibold text-[#D4A843] uppercase tracking-widest">
                Admin
              </div>
              {adminLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20"
                        : "text-[#A0A0B0] hover:text-[#F5F5F5] hover:bg-white/5"
                    )}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#A0A0B0] hover:text-[#FF1744] hover:bg-white/5 transition-all w-full mt-2"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </aside>

      <main className="flex-1 lg:ml-64 p-6">
        {isAdminRoute && !isAdmin && (
          <div className="text-center py-12">
            <p className="text-sm text-[#FF1744]">Access denied. Admin privileges required.</p>
          </div>
        )}
        {(!isAdminRoute || isAdmin) && children}
      </main>
    </div>
  )
}
