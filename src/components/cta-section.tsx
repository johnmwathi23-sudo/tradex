"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Aurora from "./Aurora"

export function CtaSection() {
  return (
    <section className="py-12 md:py-24 relative">
      <div className="absolute inset-0 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1D29] to-[#0A0B0F] border border-[#D4A843]/20 p-6 sm:p-12 md:p-20 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <Aurora
              colorStops={["#D4A843", "#C9A84C", "#5A4A24"]}
              amplitude={0.6}
              blend={0.3}
              speed={0.4}
            />
          </div>
          
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Ready to Start{" "}
              <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
                Trading?
              </span>
            </h2>
            <p className="text-lg text-[#A0A0B0] max-w-xl mx-auto mb-8">
              Join thousands of successful traders. Open your account in minutes and start trading the markets.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button variant="primary" size="lg">
                  Open a Free Account <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/account-types">
                <Button variant="outline" size="lg">
                  Compare Accounts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
