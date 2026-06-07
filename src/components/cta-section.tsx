"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import ColorBends from "./ColorBends"

export function CtaSection() {
  return (
    <section className="py-12 md:py-24 relative">
      <div className="absolute inset-0 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1D29] to-[#0A0B0F] border border-[#D4A843]/20 p-6 sm:p-12 md:p-20 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <ColorBends
              colors={["#D4A843", "#C9A84C", "#5A4A24"]}
              rotation={45}
              speed={0.2}
              scale={1.2}
              frequency={0.35}
              warpStrength={0.5}
              mouseInfluence={0.2}
              noise={0.015}
              parallax={0.1}
              iterations={1}
              intensity={0.25}
              bandWidth={2.5}
              transparent
              className="w-full h-full"
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
