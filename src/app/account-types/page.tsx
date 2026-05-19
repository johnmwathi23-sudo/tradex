import { AccountTypesSection } from "@/components/account-types-section"

export default function AccountTypesPage() {
  return (
    <div className="pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold">
          Choose Your{" "}
          <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
            Account Type
          </span>
        </h1>
        <p className="mt-4 text-lg text-[#A0A0B0] max-w-2xl mx-auto">
          Whether you&apos;re a beginner or a seasoned professional, we have the perfect account for you
        </p>
      </div>
      <AccountTypesSection />
    </div>
  )
}
