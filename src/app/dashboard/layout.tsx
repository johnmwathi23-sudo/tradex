"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, TrendingUp, Copy, Briefcase,
  Repeat, Settings, LogOut
} from "lucide-react"

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/trading", label: "Trading", icon: TrendingUp },
  { href: "/dashboard/copy-trading", label: "Copy Trading", icon: Copy },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/dashboard/transactions", label: "Transactions", icon: Repeat },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="pt-16 min-h-screen flex">
      <aside className="hidden lg:flex w-64 flex-col bg-[#1A1D29]/50 border-r border-white/5 p-4 fixed top-16 bottom-0">
        <nav className="space-y-1 flex-1">
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
        </nav>
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#A0A0B0] hover:text-[#FF1744] hover:bg-white/5 transition-all">
          <LogOut size={18} />
          Log Out
        </button>
      </aside>

      <main className="flex-1 lg:ml-64 p-6">
        {children}
      </main>
    </div>
  )
}
