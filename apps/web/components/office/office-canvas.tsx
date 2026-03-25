"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OfficeScene } from "./scene/office-scene";
import type { OfficeAgent3D } from "./hooks/use-office-state";

interface OfficeCanvasProps {
  agents: OfficeAgent3D[];
  selectedAgentId: string | null;
  onAgentClick: (agent: OfficeAgent3D) => void;
}

export default function OfficeCanvas({ agents, selectedAgentId, onAgentClick }: OfficeCanvasProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [15, 12, 15], fov: 45 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ background: "#0a0a1a" }}
    >
      <Suspense fallback={null}>
        <OfficeScene
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentClick={onAgentClick}
        />
      </Suspense>
    </Canvas>
  );
}
