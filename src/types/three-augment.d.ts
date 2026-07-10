import "react/jsx-runtime"

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any
      boxGeometry: any
      meshStandardMaterial: any
      meshBasicMaterial: any
      points: any
      bufferGeometry: any
      bufferAttribute: any
      pointsMaterial: any
      group: any
      ambientLight: any
      directionalLight: any
      planeGeometry: any
      gridHelper: any
      sprite: any
      spriteMaterial: any
      perspectiveCamera: any
      orthographicCamera: any
      scene: any
      fog: any
      primitive: any
      sphereGeometry: any
      torusKnotGeometry: any
      pointLight: any
    }
  }
}
