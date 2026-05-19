"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TradingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#F5F5F5] mb-6">Trading Terminal</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm text-[#A0A0B0]">TradingView Chart Widget</p>
            <p className="text-xs text-[#A0A0B0] mt-1">Real-time charts will appear here</p>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-4">Quick Order</h3>
          <form className="space-y-3">
            <select className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm">
              <option>EUR/USD</option>
              <option>GBP/USD</option>
              <option>XAU/USD</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 rounded-lg bg-[#00C853]/20 text-[#00C853] text-sm font-semibold hover:bg-[#00C853]/30">Buy</button>
              <button className="px-3 py-2 rounded-lg bg-[#FF1744]/20 text-[#FF1744] text-sm font-semibold hover:bg-[#FF1744]/30">Sell</button>
            </div>
            <div>
              <label className="text-xs text-[#A0A0B0] block mb-1">Volume (Lots)</label>
              <input type="number" defaultValue="0.01" step="0.01" min="0.01" className="w-full px-3 py-2 rounded-lg bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm" />
            </div>
            <Button variant="primary" className="w-full">Place Order</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
