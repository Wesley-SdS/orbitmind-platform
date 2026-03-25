import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { OfficeAgent3D } from "../hooks/use-office-state";

interface OfficeHandoffProps {
  agents: OfficeAgent3D[];
}

export function OfficeHandoff({ agents }: OfficeHandoffProps) {
  const particleRef = useRef<Mesh>(null);
  const trail1Ref = useRef<Mesh>(null);
  const trail2Ref = useRef<Mesh>(null);
  const progressRef = useRef(0);

  const delivering = agents.find((a) => a.status === "delivering" && a.targetPosition);
  const target = delivering?.targetAgentId
    ? agents.find((a) => a.id === delivering.targetAgentId)
    : null;

  useFrame(() => {
    if (!delivering || !target || !particleRef.current) return;

    progressRef.current = (progressRef.current + 0.005) % 1;
    const p = progressRef.current;

    const sx = delivering.position.x, sz = delivering.position.z;
    const ex = target.position.x, ez = target.position.z;

    // Quadratic bezier with high arc
    const x = sx * (1 - p) * (1 - p) + 2 * ((sx + ex) / 2) * p * (1 - p) + ex * p * p;
    const y = 1.5 + Math.sin(p * Math.PI) * 2.5;
    const z = sz * (1 - p) * (1 - p) + 2 * ((sz + ez) / 2) * p * (1 - p) + ez * p * p;

    particleRef.current.position.set(x, y, z);

    if (trail1Ref.current) trail1Ref.current.position.set(x - 0.1, y - 0.05, z - 0.1);
    if (trail2Ref.current) trail2Ref.current.position.set(x - 0.2, y - 0.1, z - 0.2);
  });

  if (!delivering || !target) return null;

  return (
    <group>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={3} />
      </mesh>
      <mesh ref={trail1Ref}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.4} />
      </mesh>
      <mesh ref={trail2Ref}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
