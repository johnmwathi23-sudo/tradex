import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, ArrowRight } from "lucide-react"

const accounts = [
  {
    name: "Standard",
    tagline: "Trade on the most popular account type",
    spread: "from 1.2",
    spreadLabel: "pip",
    features: ["No commission", "Market execution", "Fixed & floating spreads", "Web & mobile trading", "Minimum deposit $500"],
    popular: false,
  },
  {
    name: "ECN",
    tagline: "Experience the power of direct market access",
    spread: "from 0.0",
    spreadLabel: "pip",
    features: ["Raw spreads", "No dealing desk", "Deep liquidity", "Scalping allowed", "Minimum deposit $500"],
    popular: true,
  },
  {
    name: "PRO",
    tagline: "Ultra-low spreads for experienced traders",
    spread: "from 0.6",
    spreadLabel: "pip",
    features: ["Ultra-low spreads", "Zero commissions", "Priority support", "VIP analytics", "Minimum deposit $500"],
    popular: false,
  },
]

export function AccountTypesSection() {
  return (
    <section className="py-12 md:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Accounts Built for{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              Every Ambition
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#A0A0B0] max-w-2xl mx-auto">
            Our accounts are designed to match your trading style, giving you the tools and flexibility to maximize every opportunity
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card
              key={account.name}
              className={`relative flex flex-col ${account.popular ? "border-[#D4A843]/40 shadow-lg shadow-[#D4A843]/5" : ""}`}
            >
              {account.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              <div className="pt-2 pb-6">
                <h3 className="text-2xl font-bold text-[#F5F5F5]">{account.name}</h3>
                <p className="text-sm text-[#A0A0B0] mt-1">{account.tagline}</p>
              </div>

              <div className="pb-6 border-b border-white/5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#D4A843]">{account.spread}</span>
                  <span className="text-sm text-[#A0A0B0]">{account.spreadLabel}</span>
                </div>
              </div>

              <ul className="py-6 space-y-3 flex-1">
                {account.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-[#A0A0B0]">
                    <Check size={16} className="text-[#D4A843] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/register">
                <Button variant={account.popular ? "primary" : "outline"} className="w-full">
                  Open {account.name} Account <ArrowRight size={16} />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
