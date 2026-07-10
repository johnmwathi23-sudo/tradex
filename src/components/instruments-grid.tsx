"use client"

import { Card } from "@/components/ui/card"
import { 
  DollarSign, BarChart3, Gem, Coins, Flame, LineChart 
} from "lucide-react"

const instruments = [
  {
    icon: DollarSign,
    title: "Currency Pairs",
    description: "Access over 60 currency pairs with seamless execution and low spreads.",
    count: "60+",
  },
  {
    icon: BarChart3,
    title: "Indices",
    description: "Invest in indices with zero commissions and advanced conditions.",
    count: "15+",
  },
  {
    icon: Gem,
    title: "Metals",
    description: "Diversify your portfolio and speculate on Gold and Silver price movements.",
    count: "4+",
  },
  {
    icon: Coins,
    title: "Cryptocurrencies",
    description: "Trade a wide variety of digital assets and profit from market fluctuations.",
    count: "30+",
  },
  {
    icon: Flame,
    title: "Energies",
    description: "Trade top-tier energies instruments with conditions tailored to empower your strategy.",
    count: "5+",
  },
  {
    icon: LineChart,
    title: "Stocks & ETFs",
    description: "Access global equity markets and trade leading companies and funds.",
    count: "100+",
  },
]

export function InstrumentsGrid() {
  return (
    <section className="py-12 md:py-24 bg-[#0A0B0F] relative">
      <div className="absolute inset-0 bg-gradient-to-t from-[#D4A843]/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Trade the World&apos;s Most In-Demand{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              Financial Instruments
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#A0A0B0] max-w-2xl mx-auto">
            From one powerful platform, access global markets with institutional-grade conditions
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {instruments.map((item) => (
            <Card key={item.title} className="group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4A843]/5 rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4A843]/10 flex items-center justify-center group-hover:bg-[#D4A843]/20 transition-colors">
                    <item.icon size={22} className="text-[#D4A843]" />
                  </div>
                  <span className="text-2xl font-bold text-[#D4A843]">{item.count}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">{item.title}</h3>
                <p className="text-sm text-[#A0A0A0] leading-relaxed">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
