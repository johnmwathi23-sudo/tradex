"use client"

import { useEffect, useRef } from "react"

export default function TestEffect() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    
    el.style.backgroundColor = "red"
    el.style.width = "100px"
    el.style.height = "100px"
  }, [])

  return <div ref={ref} />
}