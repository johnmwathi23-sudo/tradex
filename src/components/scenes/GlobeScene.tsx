"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { Line } from "@react-three/drei"

const ARC_PAIRS = [
  { from: [0.8, 0.3, 0.5], to: [-0.6, -0.4, 0.7] },
  { from: [-0.5, 0.6, 0.6], to: [0.7, -0.3, -0.5] },
  { from: [0.3, -0.7, 0.6], to: [-0.8, 0.5, -0.3] },
  { from: [-0.7, -0.2, 0.7], to: [0.5, 0.6, -0.5] },
  { from: [0.6, 0.5, -0.6], to: [-0.4, -0.7, -0.5] },
]

function ConnectionArc({ from, to, color }: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
}) {
  const points = useMemo(() => {
    const mid = new THREE.Vector3(
      (from[0] + to[0]) / 2 * 1.4,
      (from[1] + to[1]) / 2 * 1.4 + 0.5,
      (from[2] + to[2]) / 2 * 1.4,
    )
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from).multiplyScalar(1.3),
      mid,
      new THREE.Vector3(...to).multiplyScalar(1.3),
    )
    return curve.getPoints(30)
  }, [from, to])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={0.5}
      transparent
      opacity={0.5}
      blending={THREE.AdditiveBlending}
    />
  )
}

function GlobeNodes() {
  const nodesRef = useRef<THREE.Points>(null)

  const [positions] = useMemo(() => {
    const count = 60
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.25
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return [pos]
  }, [])

  useFrame(({ clock }) => {
    if (!nodesRef.current) return
    const s = 0.8 + Math.sin(clock.getElapsedTime() * 0.5) * 0.2
    ;(nodesRef.current.material as THREE.PointsMaterial).size = s * 0.06
  })

  return (
    <points ref={nodesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#D4A843"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function GlobeScene() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock, pointer }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.08 + pointer.x * 0.1
    groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.05) * 0.05 + pointer.y * 0.05
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#D4A843" />

      <mesh>
        <sphereGeometry args={[1.2, 32, 24]} />
        <meshStandardMaterial
          color="#1A1D29"
          metalness={0.3}
          roughness={0.7}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.2, 48, 36]} />
        <meshBasicMaterial
          color="#D4A843"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      <GlobeNodes />

      {ARC_PAIRS.map((pair, i) => (
        <ConnectionArc
          key={i}
          from={pair.from as [number, number, number]}
          to={pair.to as [number, number, number]}
          color="#D4A843"
        />
      ))}
    </group>
  )
}
