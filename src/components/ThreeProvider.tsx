"use client"

import { useEffect, useRef, ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import CameraController from "./CameraController"
import HeroScene from "./scenes/HeroScene"
import GlobeScene from "./scenes/GlobeScene"
import ChartScene from "./scenes/ChartScene"
import StepScene from "./scenes/StepScene"
import Effects from "./scenes/Effects"

gsap.registerPlugin(ScrollTrigger)

export default function ThreeProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.2,
    })

    lenisRef.current = lenis

    lenis.on("scroll", ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value as number, { immediate: true })
        }
        return lenis.scroll
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
      },
      pinType: document.body.style.transform ? "transform" : "fixed",
    })

    ScrollTrigger.refresh()

    return () => {
      lenis.destroy()
      gsap.ticker.lagSmoothing(1)
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [])

  return (
    <>
      <div
        className="fixed inset-0 z-0"
        style={{ pointerEvents: "none" }}
      >
        <Canvas
          camera={{ position: [0, 0.5, 5], fov: 50, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "transparent" }}
        >
          <HeroScene />
          <GlobeScene />
          <ChartScene />
          <StepScene />
          <CameraController />
          <Effects />
        </Canvas>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </>
  )
}
