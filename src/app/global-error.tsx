"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("Global error:", error)
  return (
    <html>
      <body className="min-h-screen bg-[#0A0B0F] flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-[#F5F5F5] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#A0A0B0] mb-6 max-w-md">{error.message}</p>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] font-semibold text-sm hover:shadow-lg transition-all"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
