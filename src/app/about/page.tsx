export default function AboutPage() {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">
            About{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              TradeX
            </span>
          </h1>
          <p className="mt-4 text-lg text-[#A0A0B0]">
            Empowering traders worldwide with cutting-edge technology and elite market conditions
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-4">Our Mission</h2>
            <p className="text-[#A0A0B0] leading-relaxed mb-6">
              TradeX was built to democratize access to global financial markets. We believe that every trader,
              regardless of location or capital, deserves institutional-grade trading conditions, transparent
              pricing, and the ability to copy proven successful strategies.
            </p>
            <p className="text-[#A0A0B0] leading-relaxed mb-6">
              Headquartered with a global vision, we understand the unique needs of traders
              in every market. From M-Pesa deposits to local payment solutions, every feature is designed
              with our global community in mind.
            </p>
            <p className="text-[#A0A0B0] leading-relaxed">
              Our copy trading platform connects novice traders with verified professionals, creating an
              ecosystem where expertise is rewarded and everyone can benefit from collective success.
            </p>
          </div>
          <div className="bg-[#1A1D29] rounded-3xl p-8 border border-white/5">
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "50,000+", label: "Active Traders" },
                { value: "120+", label: "Countries" },
                { value: "$2.5B+", label: "Monthly Volume" },
                { value: "0.0", label: "Spreads From" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-[#D4A843]">{stat.value}</div>
                  <div className="text-sm text-[#A0A0B0] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
