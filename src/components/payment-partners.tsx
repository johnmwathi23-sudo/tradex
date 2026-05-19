import { CreditCard, Building2, Smartphone, Landmark } from "lucide-react"

const partners = [
  { icon: CreditCard, name: "Visa" },
  { icon: CreditCard, name: "Mastercard" },
  { icon: Smartphone, name: "M-Pesa" },
  { icon: Building2, name: "Bank Transfer" },
  { icon: Landmark, name: "Skrill" },
  { icon: Landmark, name: "Neteller" },
  { icon: Landmark, name: "USDT" },
  { icon: Landmark, name: "BTC" },
]

export function PaymentPartners() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
            We partner with trusted global payment leaders
          </h3>
          <p className="text-sm text-[#A0A0B0]">
            Fast, secure, and locally tailored deposit and withdrawal solutions
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
