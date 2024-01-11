import { Environment, OrbitControls } from "@react-three/drei";
import { Map } from "./Map";
import { useEffect, useState } from "react";
import { Joystick, insertCoin, myPlayer, onPlayerJoin, useMultiplayerState } from "playroomkit";
import { CharacterController } from "./CharacterController";
import { Bullet } from "./Bullet";
import { isHost } from "playroomkit";

export const Experience = () => {

  // State to store players
  const [players, setPlayers] = useState([]);
  // Bullet List Locally
  const [bullets, setBullets] = useState([]);
  // Networked bullets
  const [networkBullets, setNetworkBullets] = useMultiplayerState("bullets", []); // Sync bullets across all players

  const [hits, setHits] = useState([]);
  const [networkHits, setNetworkHits] = useMultiplayerState("hits", []); // Sync hits across all players

  // Fire a bullet
  const onFire = (bullet) => {
    // Add the bullet to the list
    setBullets((bullets) => [...bullets, bullet]);
  }

  // Bullet hit
  const onHit = (bulletId) => {
    setBullets((bullets) => bullets.filter((b) => b.id !== bulletId))
  }

  // Sync bullets when local bullets change
  useEffect(() => {
    setNetworkBullets(bullets); // set the networked bullets to the local bullets list
  }, [bullets])

  const start = async () => {
    // Start the game
    await insertCoin();

    // Create a joystick controller for each joining player
    onPlayerJoin((state) => {
      // Joystick will only create UI for current player (myPlayer)
      // For others, it will only sync their state
      const joystick = new Joystick(state, {
        type: "angular",
        buttons: [{ id: "fire", label: "Fire" }],
      });
      const newPlayer = { state, joystick };
      state.setState("health", 100);
      state.setState("deaths", 0);
      state.setState("kills", 0);
      setPlayers((players) => [...players, newPlayer]);
      state.onQuit(() => {
        setPlayers((players) => players.filter((p) => p.state.id !== state.id));
      });
    });
  };

  useEffect(() => {
    start();
  }, [])

  // When a player is killed
  const onKilled = (_victim, killer) => {
    const killerState = players.find((p) => p.state.id === killer); // find the killer
    if (killerState) {
      killerState.state.setState("kills", killerState.state.state.kills + 1); // add a kill
    }
  }

  return (
    <>
      <Map />
      {players.map(({ state, joystick }, index) => (
        <CharacterController
          key={state.id}
          state={state}
          userPlayer={state.id === myPlayer()?.id}
          joystick={joystick}
          onFire={onFire}
          onKilled={onKilled}
        />
      ))}

      {/* Bullets */}
      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet key={bullet.id} {...bullet} onHit={() => onHit(bullet.id)} />
      ))}

      <directionalLight
        position={[25, 18, -25]}
        intensity={0.6}
        castShadow
        shadow-camera-near={0}
        shadow-camera-far={80}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-width={4096}
        shadow-camera-height={4096}
        shadow-bias={-0.0001}
        />
      <Environment
        files={['./environmentMaps/1/px.jpg', './environmentMaps/1/nx.jpg', './environmentMaps/1/py.jpg', './environmentMaps/1/ny.jpg', './environmentMaps/1/pz.jpg', './environmentMaps/1/nz.jpg']}
        intensity={3}
        />
    </>
  );
};
