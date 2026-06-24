import { Wallet } from "lucide-react"

export function PaymentPartners() {
  return (
    <section className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
            Crypto deposits via USDT (TRC-20)
          </h3>
          <p className="text-sm text-[#A0A0B0]">
            Deposit using USDT on the TRC-20 network. Simple and secure.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
          <div className="flex items-center gap-2 text-[#A0A0B0]">
            <Wallet size={20} />
            <span className="text-sm font-semibold">USDT (TRC-20)</span>
          </div>
        </div>
      </div>
    </section>
  )
}
