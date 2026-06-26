"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "What is Primestone Markets?",
    a: "Primestone Markets is a premier forex and copy trading platform that allows you to trade global financial markets or automatically copy the strategies of professional traders. We offer competitive spreads, high leverage, and a seamless trading experience.",
  },
  {
    q: "How does copy trading work?",
    a: "Copy trading allows you to automatically replicate the trades of experienced traders. Simply browse our verified master traders, choose one that matches your risk preference, allocate funds, and our system will automatically copy their trades into your account proportionally.",
  },
  {
    q: "What is the minimum deposit?",
    a: "The minimum deposit for all account types is $200. Deposits are processed via USDT (TRC-20) and credited to your trading account once confirmed.",
  },
  {
    q: "How do I deposit funds?",
    a: "Simply log in to your dashboard, click 'Deposit', enter the amount and your card details. Payments are processed securely via Stripe. Funds are credited instantly and automatically converted to USDT.",
  },
  {
    q: "Is Primestone Markets regulated?",
    a: "Primestone Markets operates in full compliance with international financial regulations. We maintain segregated client accounts to ensure the safety of your funds. Please refer to our legal documentation for detailed regulatory information.",
  },
  {
    q: "What trading platforms do you support?",
    a: "Primestone Markets is available on web, mobile, and desktop. Our proprietary WebTrader is accessible directly from your browser with advanced charting tools, one-click trading, and real-time market data.",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawals are processed within 24 hours on business days. USDT withdrawals are sent directly to your external wallet once approved.",
  },
  {
    q: "What leverage do you offer?",
    a: "We offer leverage up to 1:2000, allowing you to maximize your trading potential. Please note that higher leverage also increases risk, and we encourage responsible trading.",
  },
]

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="pt-20 pb-12 md:pt-32 md:pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="mt-4 text-lg text-[#A0A0B0]">
            Everything you need to know about trading with Primestone Markets
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
