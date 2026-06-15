import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/components/ui/toast"
import ThreeProvider from "@/components/ThreeProvider"
import LoadingScreen from "@/components/LoadingScreen"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Primestone Markets - Copy the Best Traders In The Market",
  description:
    "Primestone Markets is a premier forex and copy trading platform. Copy professional traders, access elite market conditions, and trade global markets with zero commission.",
  keywords: "forex trading, copy trading, CFD trading, online trading, Primestone Markets",
  icons: {
    icon: "/images/primestone-logo.svg",
    apple: "/images/primestone-logo.svg",
  },
  manifest: "/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Primestone Markets",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0B0F",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-[#0A0B0F] text-[#F5F5F5] font-sans antialiased flex flex-col">
        <LoadingScreen />
        <ThreeProvider>
          <AuthProvider>
            <ToastProvider>
              <Header />
              <main className="flex-1 relative z-10">{children}</main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </ThreeProvider>
      </body>
    </html>
  )
}
