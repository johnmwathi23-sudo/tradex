import { Users, Globe, Award, TrendingUp } from "lucide-react"

const stats = [
  { icon: Users, value: "50,000+", label: "Active Traders" },
  { icon: Globe, value: "120+", label: "Countries" },
  { icon: Award, value: "$2.5B+", label: "Monthly Volume" },
  { icon: TrendingUp, value: "99.9%", label: "Uptime" },
]

export function StatsSection() {
  return (
    <section className="py-10 md:py-16 bg-gradient-to-r from-[#D4A843]/5 to-[#E5C05A]/5 border-y border-[#D4A843]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#D4A843]/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon size={22} className="text-[#D4A843]" />
              </div>
              <div className="text-3xl font-bold text-[#F5F5F5]">{stat.value}</div>
              <div className="text-sm text-[#A0A0B0] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
