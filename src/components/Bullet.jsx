import { RigidBody, vec3 } from "@react-three/rapier"
import { MeshBasicMaterial } from "three"
import { useEffect, useRef } from "react"
import { WEAPON_OFFSET } from "./CharacterController";
import { isHost } from "playroomkit";


const BULLET_SPEED = 20;

const bulletMaterial = new MeshBasicMaterial({
  color: 'hotpink',
  toneMapped: false
})

bulletMaterial.color.multiplyScalar(42);

export const Bullet = ({ player, angle, position, onHit }) => {
  const rigidBody = useRef();

  // move the bullet in the direction we want
  useEffect(() => {
    const velocity = {
      x: Math.sin(angle) * BULLET_SPEED,
      y: 0,
      z: Math.cos(angle) * BULLET_SPEED,
    }

    rigidBody.current.setLinvel(velocity, true)

  }, [])

  return (
    <group position={[position.x, position.y, position.z]} rotation-y={angle}>
      <group
        position-x={WEAPON_OFFSET.x}
        position-y={WEAPON_OFFSET.y}
        position-z={WEAPON_OFFSET.z}
      >
        <RigidBody
          ref={rigidBody}
          gravityScale={0}
          sensor
          onIntersectionEnter={(e) => {
            if (isHost() && e.other.rigidBody.userData?.type !== "bullet") {
              rigidBody.current.setEnabled(false); // disable the bullet after it hits something
              onHit(vec3(rigidBody.current.translation())) // tell where the bullet hit
            }
          }}
          // pass the data to the other player
          userData={{
            type: "bullet",
            player,
            damage: 10,
          }}
        >
          <mesh position-z={0.25} material={bulletMaterial} castShadow>
            <boxGeometry args={[0.02, 0.02, 0.5]} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  )
}
