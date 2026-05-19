"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0F]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/tradex-logo.svg"
              alt="TradeX"
              width={140}
              height={35}
              className="h-8 w-auto"
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
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
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
        "lg:hidden transition-all duration-300 overflow-hidden",
        open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">Log In</Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="primary" size="sm" className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
