"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface CameraKeyframe {
  position: [number, number, number]
  target: [number, number, number]
}

const KEYFRAMES: CameraKeyframe[] = [
  { position: [0, 0.5, 5], target: [0, 0, 0] },
  { position: [3, 1, 4], target: [0, 0.2, 0] },
  { position: [0, 2, 6], target: [0, 0, 0] },
  { position: [-3, 1, 4], target: [0, 0.2, 0] },
  { position: [0, 0.5, 3.5], target: [1, 0.5, 0] },
  { position: [0, 0.2, 2.5], target: [0, 0, 0] },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export default function CameraController() {
  const { camera } = useThree()
  const scrollRef = useRef(0)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    camera.position.set(0, 0.5, 5)
    camera.lookAt(0, 0, 0)

    const totalProgress = { value: 0 }

    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        totalProgress.value = self.progress
      },
    })

    gsap.ticker.add(() => {
      scrollRef.current = totalProgress.value
    })

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [camera])

  useFrame((_, delta) => {
    const t = scrollRef.current * (KEYFRAMES.length - 1)
    const index = Math.min(Math.floor(t), KEYFRAMES.length - 2)
    const frac = t - index

    const kfA = KEYFRAMES[Math.max(0, index)]
    const kfB = KEYFRAMES[Math.min(index + 1, KEYFRAMES.length - 1)]

    const targetPos: [number, number, number] = [
      lerp(kfA.position[0], kfB.position[0], frac),
      lerp(kfA.position[1], kfB.position[1], frac),
      lerp(kfA.position[2], kfB.position[2], frac),
    ]

    const targetTgt: [number, number, number] = [
      lerp(kfA.target[0], kfB.target[0], frac),
      lerp(kfA.target[1], kfB.target[1], frac),
      lerp(kfA.target[2], kfB.target[2], frac),
    ]

    const lerpSpeed = Math.min(1, delta * 4)
    const cp = camera.position
    cp.x += (targetPos[0] - cp.x) * lerpSpeed
    cp.y += (targetPos[1] - cp.y) * lerpSpeed
    cp.z += (targetPos[2] - cp.z) * lerpSpeed

    camera.lookAt(targetTgt[0], targetTgt[1], targetTgt[2])
  })

  return null
}
