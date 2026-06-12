"use client"

import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"

export default function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.SCREEN}
        mipmapBlur
      />
      <ChromaticAberration
        offset={[0.001, 0.001]}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
