"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const CANDLESTICK_COUNT = 12
const PARTICLE_COUNT = 500

function Candlestick({ position, height, color, delay }: {
  position: [number, number, number]
  height: number
  color: string
  delay: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startY = useMemo(() => Math.random() * 0.3, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime() * 0.3 + delay
    const offset = Math.sin(t * 0.5) * 0.03
    meshRef.current.position.y = startY + offset

    const scaleY = 0.3 + Math.sin(t * 1.5 + delay) * 0.05
    meshRef.current.scale.y = scaleY
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.12, height, 0.12]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.7 + Math.random() * 0.3}
      />
    </mesh>
  )
}

function TorusKnot() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock, pointer }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    meshRef.current.rotation.x = t * 0.15
    meshRef.current.rotation.y = t * 0.2
    meshRef.current.position.x = pointer.x * 0.3
    meshRef.current.position.y = 0.8 + pointer.y * 0.15
  })

  return (
    <mesh ref={meshRef} position={[0, 0.8, -1.5]}>
      <torusKnotGeometry args={[0.5, 0.18, 100, 16]} />
      <meshStandardMaterial
        color="#D4A843"
        metalness={1}
        roughness={0.1}
        emissive="#D4A843"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime() * 0.05
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3
      pos[idx + 1] += Math.sin(t + idx) * 0.001
      pos[idx] += Math.cos(t * 0.7 + idx * 0.1) * 0.0005
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#D4A843"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function HeroScene() {
  const candles = useMemo(() => {
    const arr = []
    for (let i = 0; i < CANDLESTICK_COUNT; i++) {
      const x = (i - CANDLESTICK_COUNT / 2) * 0.35 + (Math.random() - 0.5) * 0.1
      const z = -0.5 + Math.random() * 0.5
      const height = 0.2 + Math.random() * 0.8
      const colors = ["#D4A843", "#E5C05A", "#C9A84C", "#B8923E", "#F0D060"]
      const color = colors[i % colors.length]
      arr.push({ position: [x, 0, z] as [number, number, number], height, color, delay: i * 0.3 })
    }
    return arr
  }, [])

  return (
    <group>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#D4A843" />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#E5C05A" />
      <pointLight position={[0, 3, -2]} intensity={0.8} color="#D4A843" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#0A0B0F" transparent opacity={0.3} />
      </mesh>

      {candles.map((c, i) => (
        <Candlestick key={i} {...c} />
      ))}

      <TorusKnot />
      <Particles />
    </group>
  )
}
