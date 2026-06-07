import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserPlus, Download, TrendingUp } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up in minutes with our fast and seamless boarding process. No hidden fees, no complicated paperwork.",
  },
  {
    step: "02",
    icon: Download,
    title: "Fund Your Account",
    description: "Deposit funds using your preferred payment method — M-Pesa, cards, crypto, or bank transfer. Instant processing.",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Trade & Earn",
    description: "Start trading or copy top performers. Maximize your profits with elite conditions and zero commission.",
  },
]

export function StepSection() {
  return (
    <section className="py-12 md:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Set Up Your Account in{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              3 Easy Steps
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#A0A0B0] max-w-2xl mx-auto">
            Start your trading journey in minutes, not days
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-px bg-gradient-to-r from-[#D4A843]/0 via-[#D4A843]/30 to-[#D4A843]/0 -translate-y-1/2" />
          
          {steps.map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#E5C05A] flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg shadow-[#D4A843]/20">
                <item.icon size={28} className="text-[#0A0B0F]" />
              </div>
              <div className="text-sm font-bold text-[#D4A843] mb-2">Step {item.step}</div>
              <h3 className="text-xl font-semibold text-[#F5F5F5] mb-3">{item.title}</h3>
              <p className="text-sm text-[#A0A0B0] leading-relaxed max-w-xs mx-auto">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/register">
            <Button variant="primary" size="lg">Get Started Now</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
