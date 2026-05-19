"use client"

import { Card } from "@/components/ui/card"

const holdings = [
  { instrument: "EUR/USD", type: "Forex", allocation: "35%", pnl: "+$1,240", color: "#D4A843" },
  { instrument: "XAU/USD", type: "Metals", allocation: "25%", pnl: "-$320", color: "#E5C05A" },
  { instrument: "BTC/USD", type: "Crypto", allocation: "20%", pnl: "+$2,890", color: "#00C853" },
  { instrument: "US30", type: "Indices", allocation: "20%", pnl: "+$450", color: "#A0A0B0" },
]

export default function PortfolioPage() {
  const totalPnl = holdings.reduce((sum, h) => sum + (h.pnl.startsWith("+") ? 1 : -1) * parseFloat(h.pnl.replace(/[+\$,]/g, "")), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Portfolio</h1>

      <Card className="p-6 mb-6">
        <div className="text-sm text-[#A0A0B0] mb-1">Total P&L</div>
        <div className={totalPnl >= 0 ? "text-3xl font-bold text-[#00C853]" : "text-3xl font-bold text-[#FF1744]"}>
          {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()}
        </div>
      </Card>

      <div className="space-y-3">
        {holdings.map((h) => (
          <Card key={h.instrument} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: `${h.color}20` }}>
                  <div className="w-full h-full rounded-lg" style={{ backgroundColor: h.color, width: "8px", height: "100%", borderRadius: "4px" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F5F5F5]">{h.instrument}</div>
                  <div className="text-xs text-[#A0A0B0]">{h.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[#F5F5F5]">{h.allocation}</div>
                <div className={h.pnl.startsWith("+") ? "text-sm font-medium text-[#00C853]" : "text-sm font-medium text-[#FF1744]"}>
                  {h.pnl}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
