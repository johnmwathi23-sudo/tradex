import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { InstrumentsGrid } from "@/components/instruments-grid"
import { AccountTypesSection } from "@/components/account-types-section"
import { StatsSection } from "@/components/stats-section"
import { PaymentPartners } from "@/components/payment-partners"
import { StepSection } from "@/components/step-section"
import { CtaSection } from "@/components/cta-section"
import AnimatedContent from "@/components/AnimatedContent"

export default function Home() {
  return (
    <>
      <Hero />
      <AnimatedContent distance={60} duration={0.8} threshold={0.15}>
        <Features />
      </AnimatedContent>
      <AnimatedContent distance={60} duration={0.8} threshold={0.15}>
        <InstrumentsGrid />
      </AnimatedContent>
      <AnimatedContent distance={60} duration={0.8} threshold={0.15}>
        <AccountTypesSection />
      </AnimatedContent>
      <AnimatedContent distance={60} duration={0.8} threshold={0.15}>
        <StatsSection />
      </AnimatedContent>
      <AnimatedContent distance={60} duration={0.8} threshold={0.15}>
        <PaymentPartners />
      </AnimatedContent>
      <AnimatedContent distance={60} duration={0.8} threshold={0.15}>
        <StepSection />
      </AnimatedContent>
      <AnimatedContent distance={60} duration={0.8} threshold={0.15}>
        <CtaSection />
      </AnimatedContent>
    </>
  )
}
