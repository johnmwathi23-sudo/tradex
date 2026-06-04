import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#D4A843]/5 to-transparent pointer-events-none animate-shimmer" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1D29] to-[#0A0B0F] border border-[#D4A843]/20 p-12 md:p-20 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A843]/5 rounded-full blur-[100px] pointer-events-none animate-float-slow" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4A843]/3 rounded-full blur-[80px] pointer-events-none animate-float-slow2" />
          
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
