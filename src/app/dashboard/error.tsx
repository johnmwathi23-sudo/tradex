"use client"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("Dashboard error:", error)
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-[#A0A0B0] mb-2">Something went wrong</p>
      <p className="text-xs text-[#A0A0B0]/60 mb-6 max-w-md text-center">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] font-semibold text-sm hover:shadow-lg hover:shadow-[#D4A843]/30 transition-all"
      >
        Try again
      </button>
    </div>
  )
}
