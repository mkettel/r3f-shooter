import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { SoftShadows, Loader } from "@react-three/drei";
import { Suspense } from "react";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Leaderboard } from "./components/Leaderboard";

function App() {
  return (
    <>
    <Loader />
    <Leaderboard />
    <Canvas shadows camera={{ position: [0, 30, 0], fov: 30, near: 2 }}>
      <color attach="background" args={["#242424"]} />
      <SoftShadows size={22} />
      <Suspense>
        <Physics>
          <Experience />
        </Physics>
      </Suspense>
      <EffectComposer>
        <Bloom luminanceThreshold={1} intensity={1.5} minmapBlur />
      </EffectComposer>
    </Canvas>
    </>
  );
}

export default App;
