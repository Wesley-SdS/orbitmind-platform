import { useMemo } from "react";
import * as THREE from "three";

interface OfficeDeskProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  screenColor?: string;
}

export function OfficeDesk({ position, rotation = [0, 0, 0], screenColor = "#2244aa" }: OfficeDeskProps) {
  const legMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#555566", metalness: 0.5, roughness: 0.4 }), []);

  const legPositions: [number, number][] = [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]];

  return (
    <group position={position} rotation={rotation}>
      {/* Table top */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.8]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* 4 legs */}
      {legPositions.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} material={legMaterial}>
          <cylinderGeometry args={[0.03, 0.03, 0.72, 6]} />
        </mesh>
      ))}

      {/* Holographic monitor */}
      <mesh position={[0, 1.1, -0.2]}>
        <boxGeometry args={[0.6, 0.4, 0.02]} />
        <meshStandardMaterial
          color={screenColor}
          emissive={screenColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Monitor stand */}
      <mesh position={[0, 0.85, -0.2]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 8]} />
        <meshStandardMaterial color="#444455" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[0, 0.79, 0.1]}>
        <boxGeometry args={[0.4, 0.02, 0.15]} />
        <meshStandardMaterial color="#333344" roughness={0.5} />
      </mesh>
    </group>
  );
}
