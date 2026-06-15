import { CreditCard, Bitcoin } from "lucide-react"

const partners = [
  { icon: CreditCard, name: "Visa" },
  { icon: CreditCard, name: "Mastercard" },
  { icon: CreditCard, name: "Stripe" },
  { icon: Bitcoin, name: "USDT" },
]

export function PaymentPartners() {
  return (
    <section className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
            Secure card payments powered by Stripe
          </h3>
          <p className="text-sm text-[#A0A0B0]">
            All deposits are automatically converted to USDT
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
          {partners.map((partner) => (
            <div key={partner.name} className="flex items-center gap-2 text-[#A0A0B0]">
              <partner.icon size={20} />
              <span className="text-sm font-semibold">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
