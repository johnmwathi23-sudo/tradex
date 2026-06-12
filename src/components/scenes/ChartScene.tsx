"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

function GridFloor() {
  return (
    <gridHelper
      args={[12, 20, "#D4A843", "#1A1D29"]}
      position={[0, -0.5, 0]}
    />
  )
}

function MorphingLine() {
  const line = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: "#D4A843", transparent: true, opacity: 0.8 })
      ),
    []
  )

  useEffect(() => {
    const positions = new Float32Array(80 * 3)
    for (let i = 0; i < 80; i++) {
      const x = (i / 80) * 6 - 3
      positions[i * 3] = x
      positions[i * 3 + 1] = Math.sin(i * 0.3) * 0.5 + Math.cos(i * 0.1) * 0.3
      positions[i * 3 + 2] = 0
    }
    line.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  }, [line])

  useFrame(({ clock }) => {
    const geom = line.geometry
    const attr = geom.attributes.position
    if (!attr) return
    const pos = attr.array as Float32Array
    const t = clock.getElapsedTime() * 0.3
    for (let i = 0; i < 80; i++) {
      const x = (i / 80) * 6 - 3
      pos[i * 3] = x
      pos[i * 3 + 1] = Math.sin(i * 0.3 + t) * 0.5 + Math.cos(i * 0.1 + t * 0.7) * 0.3
      pos[i * 3 + 2] = 0
    }
    attr.needsUpdate = true
  })

  return <primitive object={line} />
}

function FloatingBars() {
  const barsRef = useRef<THREE.Group>(null)
  const count = 30

  const barData = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 7,
        z: (Math.random() - 0.5) * 4,
        height: 0.1 + Math.random() * 0.6,
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? "#D4A843" : "#E5C05A",
      })
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!barsRef.current) return
    const t = clock.getElapsedTime()
    barsRef.current.children.forEach((child, i) => {
      if (i < barData.length) {
        const d = barData[i]
        const scaleY = 0.5 + Math.sin(t * d.speed + d.phase) * 0.5
        child.scale.y = Math.max(0.1, scaleY)
      }
    })
  })

  return (
    <group ref={barsRef} position={[0, -0.3, 0]}>
      {barData.map((d, i) => (
        <mesh key={i} position={[d.x, d.height / 2, d.z]}>
          <boxGeometry args={[0.08, d.height, 0.08]} />
          <meshStandardMaterial
            color={d.color}
            metalness={0.6}
            roughness={0.3}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function ChartScene() {
  return (
    <group>
      <ambientLight intensity={0.2} />
      <directionalLight position={[2, 5, 3]} intensity={1} color="#D4A843" />

      <GridFloor />
      <MorphingLine />
      <FloatingBars />
    </group>
  )
}
