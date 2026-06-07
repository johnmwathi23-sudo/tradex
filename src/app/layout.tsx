import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/components/ui/toast"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "TradeX - Copy the Best Traders In The Market",
  description:
    "TradeX is a premier forex and copy trading platform. Copy professional traders, access elite market conditions, and trade global markets with zero commission.",
  keywords: "forex trading, copy trading, CFD trading, online trading, TradeX",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-[#0A0B0F] text-[#F5F5F5] font-sans antialiased flex flex-col">
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
