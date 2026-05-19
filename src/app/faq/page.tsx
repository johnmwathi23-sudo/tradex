"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "What is TradeX?",
    a: "TradeX is a premier forex and copy trading platform that allows you to trade global financial markets or automatically copy the strategies of professional traders. We offer competitive spreads, high leverage, and a seamless trading experience.",
  },
  {
    q: "How does copy trading work?",
    a: "Copy trading allows you to automatically replicate the trades of experienced traders. Simply browse our verified master traders, choose one that matches your risk preference, allocate funds, and our system will automatically copy their trades into your account proportionally.",
  },
  {
    q: "What is the minimum deposit?",
    a: "The minimum deposit depends on your chosen account type. Standard accounts start from $10, ECN accounts from $50, and PRO accounts from $500. We also support deposits in multiple currencies including KES, USD, EUR, and NGN.",
  },
  {
    q: "How do I deposit funds using M-Pesa?",
    a: "Simply log in to your dashboard, click 'Deposit', select M-Pesa as your payment method, enter the amount and your M-Pesa phone number. You will receive an STK push on your phone to confirm the payment. Funds are credited instantly upon confirmation.",
  },
  {
    q: "Is TradeX regulated?",
    a: "TradeX operates in full compliance with international financial regulations. We maintain segregated client accounts to ensure the safety of your funds. Please refer to our legal documentation for detailed regulatory information.",
  },
  {
    q: "What trading platforms do you support?",
    a: "We support MetaTrader 4 (MT4) and MetaTrader 5 (MT5) across desktop, web, and mobile. Our proprietary TradeX WebTrader is also available directly from your browser with advanced charting tools.",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawals are processed within 24 hours on business days. M-Pesa withdrawals are processed instantly once approved. Bank transfers may take 1-3 business days depending on your region.",
  },
  {
    q: "What leverage do you offer?",
    a: "We offer leverage up to 1:2000, allowing you to maximize your trading potential. Please note that higher leverage also increases risk, and we encourage responsible trading.",
  },
]

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="mt-4 text-lg text-[#A0A0B0]">
            Everything you need to know about trading with TradeX
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Card
              key={i}
              className="p-0 overflow-hidden cursor-pointer"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex items-center justify-between p-5">
                <span className="text-sm font-medium text-[#F5F5F5] pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "text-[#D4A843] shrink-0 transition-transform duration-200",
                    openIndex === i && "rotate-180"
                  )}
                />
              </div>
              <div className={cn(
                "transition-all duration-300 overflow-hidden",
                openIndex === i ? "max-h-96 pb-5 px-5" : "max-h-0"
              )}>
                <p className="text-sm text-[#A0A0B0] leading-relaxed">{faq.a}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
