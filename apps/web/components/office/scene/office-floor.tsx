import { MeshReflectorMaterial } from "@react-three/drei";

export function OfficeFloor() {
  return (
    <>
      {/* Reflective main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={0.5}
          roughness={1}
          depthScale={1.2}
          color="#111122"
          metalness={0.5}
          mirror={0}
        />
      </mesh>

      {/* Grid overlay */}
      <gridHelper args={[40, 60, "#222244", "#1a1a2e"]} position={[0, 0.01, 0]} />
    </>
  );
}
