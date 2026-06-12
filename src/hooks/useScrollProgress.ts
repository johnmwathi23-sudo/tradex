"use client"

import { useEffect, useState, useRef } from "react"

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (raf.current) return
      raf.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
        raf.current = null
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  return progress
}
