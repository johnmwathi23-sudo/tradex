import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(212,168,67,0.06) 0%, transparent 100%)" }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1D29] to-[#0A0B0F] border border-[#D4A843]/20 p-12 md:p-20 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,168,67,0.12) 0%, transparent 70%)", willChange: "transform", animation: "orbFloat2 20s ease-in-out infinite" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 70%)", willChange: "transform", animation: "orbFloat1 25s ease-in-out infinite" }} />
          
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
