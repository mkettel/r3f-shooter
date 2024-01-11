import { useRef, useState } from "react"
import { CharacterSoldier } from "./CharacterSoldier"
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"
import { isHost } from "playroomkit"
import { CameraControls } from "@react-three/drei"

const MOVEMENT_SPEED = 200;
const FIRE_RATE = 380;

// Create weapon offset to make weapon look like it is firing
export const WEAPON_OFFSET = {
  x: -0.2,
  y: 1.1,
  z: 0.8,
}

export const CharacterController = ({
  // Props
  state,
  joystick,
  userPlayer,
  onFire,
  ...props
}) => {

  const group = useRef()
  const character = useRef()
  const rigidbody = useRef()
  const controls = useRef()
  const lastShoot = useRef(0)
  const [animation, setAnimation] = useState("Idle")

  // use Frame to update the character's position
  useFrame((_, delta) => {

    // camera follow
    if (controls.current) {
      const cameraDistanceY = window.innerWidth < 1024 ? 16 : 20;
      const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;
      const playerWorldPos = vec3(rigidbody.current.translation())
      controls.current.setLookAt(
        playerWorldPos.x,
        playerWorldPos.y + (state.state.dead ? 12 : cameraDistanceY),
        playerWorldPos.z + (state.state.dead ? 2 : cameraDistanceZ),
        playerWorldPos.x,
        playerWorldPos.y + 1.7,
        playerWorldPos.z,
        true
      )
    }

    // update player based on the joystick input
    const angle = joystick.angle();
    if (joystick.isJoystickPressed() && angle) {
      // set the ne animation to run
      // set the character's rotation to the angle of the joystick
      setAnimation("Run")
      character.current.rotation.y = angle;

      const impulse = {
        x: Math.sin(angle) * MOVEMENT_SPEED * delta,
        y: 0,
        z: Math.cos(angle) * MOVEMENT_SPEED * delta,
      }

      // apply the impulse to the rigidbody
      rigidbody.current.applyImpulse(impulse, true)
    } else {
      setAnimation("Idle") // set the animation to idle if the joystick is not pressed
    }

    /**
     * Update the player's position based on host or client
     * they have to get the state from the host if they are not the host
     */
    if (isHost()) {
      state.setState("pos", rigidbody.current.translation())
    } else {
      const pos = state.getState('pos');
      if (pos) {
        rigidbody.current.setTranslation(pos);
      }
    }

    // Check if the Fire Button is pressed
    if (joystick.isPressed("fire")) {
      // fire
      setAnimation("Idle_Shoot");
      if (isHost()) {
        if (Date.now() - lastShoot.current > FIRE_RATE) {
          lastShoot.current = Date.now();
          const newBullet = {
            id: state.id + "-" + new Date(),
            position: vec3(rigidbody.current.translation()),
            angle,
            players: state.id,
          }
          onFire(newBullet);
        }
      }
    }

  })

  return (
    <group ref={group} {...props}>
      {/* if we are user player give it cameraControls */}
      {userPlayer && <CameraControls ref={controls} />}

      <RigidBody
        ref={rigidbody}
        colliders={false}
        linearDamping={12}
        lockRotations
        type={isHost() ? "dynamic" : "kinematicPosition"}
        >
        <group ref={character}>
          <CharacterSoldier
            color={state.state.profile?.color}
            animation={animation}
          />
          {userPlayer && <Crosshair position={[WEAPON_OFFSET.x, WEAPON_OFFSET.y, WEAPON_OFFSET.z]} />}
        </group>
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>

  )
}
/**
 * import the props that the player will need
 * import the CharacterSoldier component using groups and refs to animate the character
 * import the RigidBody component to add physics to the character
 * import the CapsuleCollider component to add collision to the character
 * create a ref to the character to move it
 * create a ref to the rigidbody to apply physics
 * Update the character's position using useFrame
 * Update the player's animation based on the joystick input
 * Update the character's rotation based on the joystick input
 * apply linearDamping to slow it down a bit
 * lock the rotations so the character doesn't fall over
 */

const Crosshair = (props) => {
  return (
    <group {...props}>
      <mesh position-z={1}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.9} />
      </mesh>
      <mesh position-z={2}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.85} />
      </mesh>
      <mesh position-z={3}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.8} />
      </mesh>

      <mesh position-z={4.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.7} transparent />
      </mesh>

      <mesh position-z={6.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.6} transparent />
      </mesh>

      <mesh position-z={9}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.2} transparent />
      </mesh>
    </group>
  );
};
