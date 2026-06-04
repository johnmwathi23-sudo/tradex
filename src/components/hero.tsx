import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, Shield, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4A843]/5 via-transparent to-transparent pointer-events-none animate-shimmer" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D4A843]/5 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#D4A843]/3 rounded-full blur-[120px] pointer-events-none animate-float-slow2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4A843]/[0.02] rounded-full blur-[150px] pointer-events-none animate-pulse-glow" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4A843]/10 border border-[#D4A843]/20 text-[#D4A843] text-sm font-medium mb-6">
            <Zap size={14} />
            Trusted by 50,000+ traders worldwide
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            Copy the Best{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              Traders
            </span>{" "}
            In The Market
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#A0A0B0] max-w-xl leading-relaxed">
            Unlock the full power of your capital with elite market conditions. 
            Copy professional traders, earn consistent returns, and scale your portfolio.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/account-types">
              <Button variant="outline" size="lg">
                View Account Types
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-8 mt-12">
            {[
              { icon: TrendingUp, value: "1:2000", label: "Leverage" },
              { icon: Shield, value: "0.0", label: "Spreads From" },
              { icon: Zap, value: "Zero", label: "Commission" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center">
                  <stat.icon size={18} className="text-[#D4A843]" />
                </div>
                <div>
                  <div className="text-lg font-bold text-[#F5F5F5]">{stat.value}</div>
                  <div className="text-xs text-[#A0A0B0]">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
