import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { InstrumentsGrid } from "@/components/instruments-grid"
import { AccountTypesSection } from "@/components/account-types-section"
import { StatsSection } from "@/components/stats-section"
import { PaymentPartners } from "@/components/payment-partners"
import { StepSection } from "@/components/step-section"
import { CtaSection } from "@/components/cta-section"

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <InstrumentsGrid />
      <AccountTypesSection />
      <StatsSection />
      <PaymentPartners />
      <StepSection />
      <CtaSection />
    </>
  )
}
