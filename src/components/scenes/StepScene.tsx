"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface StepData {
  position: [number, number, number]
  size: [number, number, number]
  delay: number
}

const STEPS: StepData[] = [
  { position: [-2, -0.3, 0], size: [1.2, 0.15, 0.6], delay: 0 },
  { position: [-0.8, 0.2, 0], size: [1.2, 0.15, 0.6], delay: 0.3 },
  { position: [0.4, 0.7, 0], size: [1.2, 0.15, 0.6], delay: 0.6 },
  { position: [1.6, 1.2, 0], size: [1.2, 0.15, 0.6], delay: 0.9 },
  { position: [2.8, 1.7, 0], size: [1.8, 0.2, 0.8], delay: 1.2 },
]

function StepPlatform({ data }: { data: StepData }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime() * 0.4 + data.delay
    const bob = Math.sin(t) * 0.04
    meshRef.current.position.y = data.position[1] + bob
  })

  return (
    <mesh ref={meshRef} position={data.position}>
      <boxGeometry args={data.size} />
      <meshStandardMaterial
        color="#D4A843"
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.6}
        emissive="#D4A843"
        emissiveIntensity={0.15}
      />
    </mesh>
  )
}

function StepParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const progress = i / count
      pos[i * 3] = -2.5 + progress * 6
      pos[i * 3 + 1] = -0.5 + progress * 2.5 + Math.sin(progress * 10) * 0.2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime() * 0.3
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      const base = (pos[idx] + 2.5) / 6
      pos[idx + 1] = -0.5 + base * 2.5 + Math.sin(base * 10 + t) * 0.2
      pos[idx] += 0.003
      if (pos[idx] > 3.5) {
        pos[idx] = -2.5
        pos[idx + 1] = -0.5 + Math.random() * 0.5
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#E5C05A"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function StepScene() {
  return (
    <group>
      <ambientLight intensity={0.2} />
      <directionalLight position={[1, 3, 2]} intensity={1.2} color="#D4A843" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#0A0B0F" transparent opacity={0.2} />
      </mesh>

      {STEPS.map((step, i) => (
        <StepPlatform key={i} data={step} />
      ))}

      <StepParticles />
    </group>
  )
}
