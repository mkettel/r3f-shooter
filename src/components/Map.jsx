import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { useEffect } from "react"

// Load in the Map
export const Map = () => {

  const map = useGLTF("models/map.glb")

  // Add shadows to the map
  useEffect(() => {
    map.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  })

  return (
    <>
      <RigidBody colliders="trimesh" type="fixed">
        <primitive object={map.scene} />
      </RigidBody>
    </>
  )
}

// Preload the Map
useGLTF.preload("models/map.glb")
