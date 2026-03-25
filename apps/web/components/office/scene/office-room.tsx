import { Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface OfficeRoomProps {
  name: string;
  position: [number, number, number];
  size: [number, number];
  color: string;
  floorColor: string;
}

export function OfficeRoom({ name, position, size, color, floorColor }: OfficeRoomProps) {
  const [w, d] = size;
  const wallMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: 0.06,
        roughness: 0.1,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
    [color],
  );

  // Luminous floor border (edges only)
  const edgePoints = useMemo(() => {
    const hw = w / 2, hd = d / 2;
    return new Float32Array([
      -hw, 0, -hd,  hw, 0, -hd,
       hw, 0, -hd,  hw, 0,  hd,
       hw, 0,  hd, -hw, 0,  hd,
      -hw, 0,  hd, -hw, 0, -hd,
    ]);
  }, [w, d]);

  return (
    <group position={position}>
      {/* Room floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* Luminous edge lines on floor */}
      <lineSegments position={[0, 0.03, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[edgePoints, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.4} />
      </lineSegments>

      {/* Glass walls — front */}
      <mesh position={[0, 1, -d / 2]} material={wallMaterial}>
        <boxGeometry args={[w, 2, 0.04]} />
      </mesh>
      {/* Glass walls — back */}
      <mesh position={[0, 1, d / 2]} material={wallMaterial}>
        <boxGeometry args={[w, 2, 0.04]} />
      </mesh>
      {/* Glass walls — left */}
      <mesh position={[-w / 2, 1, 0]} material={wallMaterial}>
        <boxGeometry args={[0.04, 2, d]} />
      </mesh>
      {/* Glass walls — right */}
      <mesh position={[w / 2, 1, 0]} material={wallMaterial}>
        <boxGeometry args={[0.04, 2, d]} />
      </mesh>

      {/* Room label floating above */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
}
