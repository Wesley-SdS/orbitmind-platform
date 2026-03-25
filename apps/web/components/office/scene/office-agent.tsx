import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";
import type { Group, Mesh } from "three";
import type { OfficeAgent3D } from "../hooks/use-office-state";

const STATUS_COLORS: Record<string, string> = {
  working: "#3b82f6",
  done: "#22c55e",
  checkpoint: "#eab308",
  delivering: "#a855f7",
  idle: "#666666",
};

const STATUS_LABELS: Record<string, string> = {
  working: "Trabalhando",
  done: "Concluido",
  checkpoint: "Checkpoint",
  delivering: "Entregando",
  idle: "Idle",
};

const ROLE_COLORS: Record<string, string> = {
  researcher: "#2563eb",
  pesquisador: "#2563eb",
  strategist: "#0891b2",
  estrategista: "#0891b2",
  copywriter: "#7c3aed",
  redator: "#7c3aed",
  designer: "#db2777",
  "seo-analyst": "#0d9488",
  analista: "#0d9488",
  reviewer: "#16a34a",
  revisor: "#16a34a",
  publisher: "#d97706",
  publicador: "#d97706",
};

interface OfficeAgentProps {
  agent: OfficeAgent3D;
  onClick: () => void;
  selected: boolean;
}

export function OfficeAgent({ agent, onClick, selected }: OfficeAgentProps) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  const eyeRef = useRef<Mesh>(null);

  const roleKey = agent.role.toLowerCase().split(" ")[0] ?? "";
  const roleColor = ROLE_COLORS[roleKey] ?? "#666666";
  const statusColor = STATUS_COLORS[agent.status] ?? "#666666";
  const statusLabel = STATUS_LABELS[agent.status] ?? agent.status;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;

    // Working animation: gentle bob
    if (agent.status === "working") {
      groupRef.current.position.y = Math.sin(t * 2 + agent.position.x) * 0.05;
      if (glowRef.current) {
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.2 + Math.sin(t * 3) * 0.15;
      }
    } else {
      groupRef.current.position.y = 0;
    }

    // Delivering animation: interpolate toward target
    if (agent.status === "delivering" && agent.targetPosition) {
      const pos = groupRef.current.position;
      pos.x += (agent.targetPosition.x - pos.x) * 0.015;
      pos.z += (agent.targetPosition.z - pos.z) * 0.015;
      pos.y = 0.1 + Math.sin(t * 4) * 0.08;
    }

    // Eye glow pulse
    if (eyeRef.current) {
      (eyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.5 + Math.sin(t * 5) * 0.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[agent.position.x, 0, agent.position.z]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      {/* Body — colored cylinder */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.6, 12]} />
        <meshStandardMaterial color={roleColor} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Head — metallic sphere */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#ddddee" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Left eye — neon */}
      <mesh ref={eyeRef} position={[-0.08, 1.14, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00aaff" emissiveIntensity={2} />
      </mesh>
      {/* Right eye — neon */}
      <mesh position={[0.08, 1.14, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00aaff" emissiveIntensity={2} />
      </mesh>

      {/* Status antenna on top */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={agent.status === "working" ? 2 : 0.5}
        />
      </mesh>

      {/* Working glow ring */}
      {agent.status === "working" && (
        <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.3, 0.4, 20]} />
          <meshBasicMaterial color={roleColor} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.45, 0.55, 24]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Floating name + status */}
      <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
        <Text
          position={[0, 1.75, 0]}
          fontSize={0.16}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {agent.name.split(" ")[0]}
        </Text>
        <Text
          position={[0, 1.56, 0]}
          fontSize={0.1}
          color={statusColor}
          anchorX="center"
          anchorY="middle"
        >
          {statusLabel}
        </Text>
      </Float>
    </group>
  );
}
