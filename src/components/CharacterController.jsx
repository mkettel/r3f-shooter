import { useRef, useState, useEffect } from "react"
import { CharacterSoldier } from "./CharacterSoldier"
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier"
import { useFrame, useThree } from "@react-three/fiber"
import { isHost } from "playroomkit"
import { CameraControls, Billboard, Text } from "@react-three/drei"

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
  onKilled,
  ...props
}) => {

  const group = useRef()
  const character = useRef()
  const rigidbody = useRef()
  const controls = useRef()
  const lastShoot = useRef(0)
  const [animation, setAnimation] = useState("Idle")


  // Spawn the player randomly
  const scene = useThree((state) => state.scene) // get the scene

  const spawnRandomly = () => {
    const spawns = [];

    // get all the spawn points
    for (let i = 0; i < 1000; i++) {
      const spawn = scene.getObjectByName(`spawn_${i}`);
      if (spawn) {
        spawns.push(spawn);
      } else {
        break;
      }
    }
    const spawnPos = spawns[Math.floor(Math.random() * spawns.length)].position; // get a random spawn point
    rigidbody.current.setTranslation(spawnPos); // set the player's position to the spawn point
  }


  // Spawn the player randomly when they join
  useEffect(() => {
    if (isHost()) {
      spawnRandomly();
    }
  }, [])


  // use Frame to update the character's position
  useFrame((_, delta) => {

    // camera follow
    if (controls.current) {
      const cameraDistanceY = window.innerWidth < 1024 ? 20 : 20;
      const cameraDistanceZ = window.innerWidth < 1024 ? 20 : 16;
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

    // Update player if they are dead
    if (state.state.dead) {
      setAnimation("Death")
      return;
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
        onIntersectionEnter={({other}) => {
          // if we are host and other is bullet and we are alive
          if (
            isHost() &&
            other.rigidBody.userData?.type === "bullet" &&
            state.state.health > 0
          ) {
            const newHealth =
              state.state.health - other.rigidBody.userData.damage;
              if (newHealth <= 0) {
                state.setState("deaths", state.state.deaths + 1); // add a death
                state.setState("dead", true); // set the player to dead
                state.setState("health", 0); // set the health to 0
                rigidbody.current.setEnabled(false); // disable the rigidbody
                setTimeout(() => {
                  spawnRandomly(); // spawn the player randomly after 2 seconds
                  state.setState("health", 100); // set the health back to 100
                  state.setState("dead", false); // set the player back to alive
                }, 2000)
                onKilled(state.id, other.rigidBody.userData.player); // tell the other player they killed us
              }
          }
        }}
        >
        <PlayerInfo state={state.state} />
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

// Create a billboard to show the player's name and health
const PlayerInfo = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;
  return (
    <Billboard position-y={2.5}>
      <Text position-y={0.36} fontSize={0.4}>
        {name}
        <meshBasicMaterial color={state.profile.color} />
      </Text>
      <mesh position-z={-0.1}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh scale-x={health / 100} position-x={-0.5 * (1 - health / 100)}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Billboard>
  );
};
