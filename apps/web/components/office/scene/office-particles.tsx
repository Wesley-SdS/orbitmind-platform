import { Sparkles } from "@react-three/drei";

export function OfficeParticles() {
  return (
    <>
      {/* Ambient sparkles */}
      <Sparkles
        count={80}
        scale={30}
        size={1.5}
        speed={0.3}
        opacity={0.25}
        color="#6366f1"
      />

      {/* Research data stream */}
      <Sparkles
        count={25}
        scale={5}
        size={2}
        speed={1}
        opacity={0.5}
        color="#3b82f6"
        position={[-6, 2, -2]}
      />

      {/* Creative data stream */}
      <Sparkles
        count={25}
        scale={5}
        size={2}
        speed={1}
        opacity={0.5}
        color="#a855f7"
        position={[0, 2, -2]}
      />

      {/* Strategy data stream */}
      <Sparkles
        count={15}
        scale={4}
        size={1.5}
        speed={0.8}
        opacity={0.4}
        color="#06b6d4"
        position={[-5, 2, 4]}
      />
    </>
  );
}
