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
  done: "Concluído",
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
  const eyeLeftRef = useRef<Mesh>(null);
  const eyeRightRef = useRef<Mesh>(null);
  const antennaRef = useRef<Mesh>(null);

  const roleKey = agent.role.toLowerCase().split(" ")[0] ?? "";
  const roleColor = ROLE_COLORS[roleKey] ?? "#666666";
  const statusColor = STATUS_COLORS[agent.status] ?? "#666666";
  const statusLabel = STATUS_LABELS[agent.status] ?? agent.status;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;

    // === Position animations by status ===
    switch (agent.status) {
      case "working":
        // Gentle bob up and down
        groupRef.current.position.y = Math.sin(t * 2 + agent.position.x * 3) * 0.06;
        break;
      case "delivering":
        // Interpolate toward target
        if (agent.targetPosition) {
          const pos = groupRef.current.position;
          const dx = agent.targetPosition.x - pos.x;
          const dz = agent.targetPosition.z - pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0.1) {
            pos.x += dx * 0.015;
            pos.z += dz * 0.015;
          }
          pos.y = 0.1 + Math.sin(t * 4) * 0.1;
        }
        break;
      case "checkpoint":
        // Slow subtle pulse
        groupRef.current.position.y = Math.sin(t * 1) * 0.02;
        break;
      default:
        // idle / done: stay on ground
        groupRef.current.position.y = 0;
        break;
    }

    // === Glow ring pulse ===
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (agent.status === "working") {
        mat.opacity = 0.2 + Math.sin(t * 3) * 0.15;
      } else if (agent.status === "delivering") {
        mat.opacity = 0.3 + Math.sin(t * 5) * 0.2;
      }
    }

    // === Eye intensity varies by status ===
    const eyeIntensity =
      agent.status === "working"  ? 2.0 + Math.sin(t * 5) * 1.0 :
      agent.status === "idle"     ? 0.8 + Math.sin(t * 1.5) * 0.3 :
      agent.status === "delivering" ? 2.5 + Math.sin(t * 6) * 0.8 :
      1.5 + Math.sin(t * 3) * 0.5;

    if (eyeLeftRef.current) {
      (eyeLeftRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity;
    }
    if (eyeRightRef.current) {
      (eyeRightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = eyeIntensity;
    }

    // === Antenna pulse by status ===
    if (antennaRef.current) {
      const mat = antennaRef.current.material as THREE.MeshStandardMaterial;
      switch (agent.status) {
        case "working":
          mat.emissiveIntensity = 2 + Math.sin(t * 4) * 1.5;
          break;
        case "checkpoint":
          mat.emissiveIntensity = Math.sin(t * 2) > 0 ? 3 : 0.3; // Blink on/off
          break;
        case "delivering":
          mat.emissiveIntensity = 2 + Math.sin(t * 6) * 1;
          break;
        case "done":
          mat.emissiveIntensity = 1.5;
          break;
        default:
          mat.emissiveIntensity = 0.3;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[agent.position.x, 0, agent.position.z]}
      rotation={[0, Math.PI, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      {/* Body: colored cylinder */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.6, 12]} />
        <meshStandardMaterial color={roleColor} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Head: metallic sphere */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#ddddee" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Left eye: neon */}
      <mesh ref={eyeLeftRef} position={[-0.08, 1.14, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00aaff" emissiveIntensity={2} />
      </mesh>
      {/* Right eye: neon */}
      <mesh ref={eyeRightRef} position={[0.08, 1.14, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00aaff" emissiveIntensity={2} />
      </mesh>

      {/* Status antenna on top */}
      <mesh ref={antennaRef} position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={agent.status === "working" ? 2 : 0.5}
        />
      </mesh>

      {/* Antenna stem */}
      <mesh position={[0, 1.33, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.08, 6]} />
        <meshStandardMaterial color="#888899" metalness={0.6} />
      </mesh>

      {/* Glow ring on floor: working + delivering */}
      {(agent.status === "working" || agent.status === "delivering") && (
        <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.3, 0.42, 24]} />
          <meshBasicMaterial
            color={agent.status === "delivering" ? "#a855f7" : roleColor}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.45, 0.55, 24]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Floating name + status label */}
      <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
        <Text
          position={[0, 1.8, 0]}
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
          position={[0, 1.6, 0]}
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
