import Link from "next/link"
import Image from "next/image"

const footerLinks = {
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/account-types", label: "Account Types" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ],
  Trading: [
    { href: "/instruments", label: "Instruments" },
    { href: "/account-types", label: "Standard Account" },
    { href: "/account-types", label: "ECN Account" },
    { href: "/account-types", label: "PRO Account" },
  ],
  Resources: [
    { href: "/faq", label: "Help Center" },
    { href: "#", label: "Trading Guide" },
    { href: "#", label: "Economic Calendar" },
    { href: "#", label: "Glossary" },
  ],
  Legal: [
    { href: "#", label: "Terms & Conditions" },
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Risk Disclaimer" },
    { href: "#", label: "AML/KYC Policy" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-[#0A0B0F] border-t border-white/5 pt-10 md:pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/images/tradex-logo.svg"
              alt="TradeX"
              width={120}
              height={30}
              className="h-7 w-auto mb-4"
            />
            <p className="text-sm text-[#A0A0B0] leading-relaxed">
              Professional forex and copy trading platform trusted by traders across the globe.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-[#F5F5F5] mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#A0A0B0] hover:text-[#D4A843] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-xs text-[#A0A0B0]/60 text-center leading-relaxed">
            Risk Warning: Trading Forex and CFDs carries a high level of risk to your capital and may result in losing more than your initial deposit. It may not be suitable for all investors. Please ensure you fully understand the risks involved.
          </p>
          <p className="text-xs text-[#A0A0B0]/40 text-center mt-4">
            &copy; {new Date().getFullYear()} TradeX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
