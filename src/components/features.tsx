import { Card } from "@/components/ui/card"
import { 
  TrendingUp, Shield, Zap, Clock, Users, Globe, 
  HeadphonesIcon, Banknote 
} from "lucide-react"

const features = [
  {
    icon: TrendingUp,
    title: "Spreads from 0.0 Pips",
    description: "By offering competitively tight spreads, we help maximise your profit margins.",
  },
  {
    icon: Shield,
    title: "Fast and Secure Withdrawals",
    description: "We give you peace of mind, with fast and secure withdrawal processes.",
  },
  {
    icon: Zap,
    title: "Leverage up to 1:2000",
    description: "Experience the full potential of your trades with our exceptional 1:2000 leverage.",
  },
  {
    icon: Clock,
    title: "Very Fast & Seamless Onboarding",
    description: "Get started in minutes with our streamlined account opening process.",
  },
  {
    icon: Banknote,
    title: "Commission Free Trading",
    description: "Take advantage of our commission free trading model, for a hassle free experience.",
  },
  {
    icon: Shield,
    title: "Funds Security",
    description: "The safety of your funds is ensured by maintaining fully segregated client accounts.",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Customer Service",
    description: "Our expert support team is available around the clock to assist you.",
  },
  {
    icon: Globe,
    title: "Deposits with Local Providers",
    description: "We provide hassle-free deposits with our local, trusted providers, making it a breeze.",
  },
  {
    icon: Users,
    title: "Copy Trading",
    description: "Copy the best traders in the market and earn passive returns with zero effort.",
  },
]

export function Features() {
  return (
    <section className="py-12 md:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              Primestone Markets
            </span>
            ?
          </h2>
          <p className="mt-4 text-lg text-[#A0A0B0] max-w-2xl mx-auto">
            Everything you need to succeed in the financial markets, powered by cutting-edge technology
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <Card key={feature.title} className="group">
              <div className="w-12 h-12 rounded-xl bg-[#D4A843]/10 flex items-center justify-center mb-4 group-hover:bg-[#D4A843]/20 transition-colors">
                <feature.icon size={22} className="text-[#D4A843]" />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#A0A0B0] leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
