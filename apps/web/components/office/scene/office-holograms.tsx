import { Text, Float } from "@react-three/drei";
import * as THREE from "three";

export function OfficeHolograms() {
  return (
    <group>
      {/* Research hologram */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
        <group position={[-6, 3.5, -2]}>
          <mesh>
            <planeGeometry args={[1.5, 1]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.06} side={THREE.DoubleSide} />
          </mesh>
          <Text position={[0, 0.3, 0.01]} fontSize={0.1} color="#3b82f6">
            Pesquisa ativa
          </Text>
          <Text position={[0, 0.1, 0.01]} fontSize={0.15} color="#60a5fa">
            3 tendencias
          </Text>
          <Text position={[0, -0.15, 0.01]} fontSize={0.08} color="#3b82f6">
            2.4K tokens
          </Text>
        </group>
      </Float>

      {/* Creative pipeline hologram */}
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.3}>
        <group position={[0, 3.5, -2]}>
          <mesh>
            <planeGeometry args={[2, 0.8]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.05} side={THREE.DoubleSide} />
          </mesh>
          <Text position={[0, 0.15, 0.01]} fontSize={0.12} color="#a855f7">
            Pipeline 4/10
          </Text>
          <Text position={[0, -0.1, 0.01]} fontSize={0.08} color="#c084fc">
            Handoff em andamento
          </Text>
        </group>
      </Float>

      {/* Strategy metrics hologram */}
      <Float speed={1.8} rotationIntensity={0.08} floatIntensity={0.4}>
        <group position={[-5, 3.5, 4]}>
          <mesh>
            <planeGeometry args={[1.2, 0.8]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.05} side={THREE.DoubleSide} />
          </mesh>
          <Text position={[0, 0.15, 0.01]} fontSize={0.1} color="#06b6d4">
            Estrategia
          </Text>
          <Text position={[0, -0.05, 0.01]} fontSize={0.12} color="#22d3ee">
            ROI +23%
          </Text>
        </group>
      </Float>
    </group>
  );
}
