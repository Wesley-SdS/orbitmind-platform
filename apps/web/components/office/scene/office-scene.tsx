import { OrbitControls, Environment, ContactShadows, BakeShadows, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { OfficeFloor } from "./office-floor";
import { OfficeRoom } from "./office-room";
import { OfficeDesk } from "./office-desk";
import { OfficeAgent } from "./office-agent";
import { OfficeFurniture } from "./office-furniture";
import { OfficeHandoff } from "./office-handoff";
import { OfficeHolograms } from "./office-holograms";
import { OfficeParticles } from "./office-particles";
import type { OfficeAgent3D } from "../hooks/use-office-state";

interface OfficeSceneProps {
  agents: OfficeAgent3D[];
  selectedAgentId: string | null;
  onAgentClick: (agent: OfficeAgent3D) => void;
}

// Room definitions for 3D positions
const ROOMS = [
  { name: "Research Lab", position: [-6, 0, -2] as [number, number, number], size: [5, 4] as [number, number], color: "#3b82f6", floorColor: "#1a1a2e" },
  { name: "Creative Studio", position: [0, 0, -2] as [number, number, number], size: [6, 4] as [number, number], color: "#a855f7", floorColor: "#1a1528" },
  { name: "Review Room", position: [6, 0, -2] as [number, number, number], size: [4, 4] as [number, number], color: "#22c55e", floorColor: "#0a1a0f" },
  { name: "Strategy Room", position: [-5, 0, 4] as [number, number, number], size: [5, 4] as [number, number], color: "#06b6d4", floorColor: "#0a1a2a" },
  { name: "Publishing", position: [1, 0, 4] as [number, number, number], size: [4, 4] as [number, number], color: "#f59e0b", floorColor: "#1a1508" },
  { name: "Lobby", position: [6, 0, 4] as [number, number, number], size: [6, 4] as [number, number], color: "#666666", floorColor: "#141418" },
];

// Desk positions in 3D world
const DESKS = [
  // Research (2 desks)
  { position: [-7, 0, -2] as [number, number, number], screenColor: "#2244aa" },
  { position: [-5, 0, -2] as [number, number, number], screenColor: "#2244aa" },
  // Creative (3 desks)
  { position: [-1.2, 0, -2] as [number, number, number], screenColor: "#6622aa" },
  { position: [1.2, 0, -2] as [number, number, number], screenColor: "#6622aa" },
  { position: [0, 0, -3] as [number, number, number], screenColor: "#6622aa" },
  // Review (1 desk)
  { position: [6, 0, -2] as [number, number, number], screenColor: "#22aa44" },
  // Strategy (2 desks)
  { position: [-6, 0, 4] as [number, number, number], screenColor: "#0088aa" },
  { position: [-4, 0, 4] as [number, number, number], screenColor: "#0088aa" },
  // Publishing (1 desk)
  { position: [1, 0, 4] as [number, number, number], screenColor: "#aa8800" },
  // Lobby (1 desk — reception)
  { position: [7, 0, 3] as [number, number, number], screenColor: "#444466" },
];

export function OfficeScene({ agents, selectedAgentId, onAgentClick }: OfficeSceneProps) {
  return (
    <>
      {/* === ENVIRONMENT === */}
      <fog attach="fog" args={["#0a0a1a", 20, 45]} />
      <ambientLight intensity={0.4} color="#334466" />
      <directionalLight
        position={[10, 15, 8]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/* Colored accent lights per room */}
      <pointLight position={[-6, 4, -2]} intensity={1.5} color="#3b82f6" distance={12} decay={2} />
      <pointLight position={[0, 4, -2]} intensity={1.2} color="#a855f7" distance={12} decay={2} />
      <pointLight position={[6, 4, -2]} intensity={1.0} color="#22c55e" distance={10} decay={2} />
      <pointLight position={[-5, 4, 4]} intensity={1.0} color="#06b6d4" distance={10} decay={2} />
      <pointLight position={[1, 4, 4]} intensity={0.8} color="#f59e0b" distance={10} decay={2} />
      <pointLight position={[0, 5, 1]} intensity={1.0} color="#378ADD" distance={15} decay={2} />

      <Environment preset="night" />
      <Stars radius={50} depth={50} count={2000} factor={2} saturation={0} fade speed={1} />

      {/* === FLOOR === */}
      <OfficeFloor />

      {/* === ROOMS === */}
      {ROOMS.map((room) => (
        <OfficeRoom key={room.name} {...room} />
      ))}

      {/* === DESKS === */}
      {DESKS.map((desk, i) => (
        <OfficeDesk key={i} {...desk} />
      ))}

      {/* === AGENTS === */}
      {agents.map((agent) => (
        <OfficeAgent
          key={agent.id}
          agent={agent}
          onClick={() => onAgentClick(agent)}
          selected={agent.id === selectedAgentId}
        />
      ))}

      {/* === HANDOFF === */}
      <OfficeHandoff agents={agents} />

      {/* === FURNITURE === */}
      <OfficeFurniture />

      {/* === HOLOGRAMS === */}
      <OfficeHolograms />

      {/* === PARTICLES === */}
      <OfficeParticles />

      {/* === SHADOWS === */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={30}
        blur={2}
        far={10}
        resolution={512}
      />
      <BakeShadows />

      {/* === CAMERA CONTROLS === */}
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        target={[0, 0, 1]}
        autoRotate
        autoRotateSpeed={0.3}
      />

      {/* === POST-PROCESSING === */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          intensity={0.8}
          mipmapBlur
        />
        <Vignette offset={0.3} darkness={0.6} />
      </EffectComposer>
    </>
  );
}
