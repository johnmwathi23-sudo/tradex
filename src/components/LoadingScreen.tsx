"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function LoadingScreen() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`loading-screen ${hidden ? "hidden" : ""}`}>
      <div className="flex flex-col items-center gap-6">
        <div className="loading-logo">
          <Image
            src="/images/primestone-logo.svg"
            alt="Primestone Markets"
            width={160}
            height={45}
            className="h-12 w-auto"
            priority
          />
        </div>
        <div className="w-48 h-0.5 bg-[#1A1D29] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#D4A843] to-[#E5C05A] rounded-full animate-[loadingBar_1.5s_ease-in-out]" />
        </div>
      </div>
      <style>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
