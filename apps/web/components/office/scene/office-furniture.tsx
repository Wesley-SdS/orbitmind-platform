import { RoundedBox } from "@react-three/drei";

export function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.12, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color="#228833" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Sofa({ position, color = "#4a3f5c" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.5, 0.4, 0.7]} radius={0.08} position={[0, 0.3, 0]}>
        <meshStandardMaterial color={color} roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[1.5, 0.5, 0.2]} radius={0.08} position={[0, 0.6, -0.25]}>
        <meshStandardMaterial color={color} roughness={0.8} />
      </RoundedBox>
    </group>
  );
}

export function CoffeeMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.25]} />
        <meshStandardMaterial color="#333344" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.7, 0.13]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

export function Whiteboard({ position, rotation = [0, 0, 0] as [number, number, number] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.6, 1.1, 0.03]} />
        <meshStandardMaterial color="#444455" />
      </mesh>
      <mesh>
        <boxGeometry args={[1.5, 1, 0.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
    </group>
  );
}

export function Bookshelf({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.3]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.7} />
      </mesh>
      {/* Books */}
      {[-0.25, 0, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0.8, 0.05]}>
          <boxGeometry args={[0.15, 0.3, 0.18]} />
          <meshStandardMaterial
            color={["#3b82f6", "#a855f7", "#f59e0b"][i]}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

/** All office furniture positioned in the world */
export function OfficeFurniture() {
  return (
    <group>
      {/* Research Lab */}
      <Whiteboard position={[-6, 1.2, -3.8]} />
      <Plant position={[-7.8, 0, -3.5]} />
      <Plant position={[-4.2, 0, -0.5]} scale={0.7} />

      {/* Creative Studio */}
      <Bookshelf position={[2.5, 0, -3.8]} />
      <Plant position={[-2.5, 0, -3.5]} scale={1.2} />
      <Plant position={[2.5, 0, -0.5]} scale={0.6} />

      {/* Review Room */}
      <Whiteboard position={[6, 1.2, -3.8]} />
      <Plant position={[7.5, 0, -0.5]} scale={0.8} />

      {/* Strategy Room */}
      <Whiteboard position={[-5, 1.2, 2.2]} />
      <CoffeeMachine position={[-7, 0, 5.5]} />
      <Plant position={[-3, 0, 5.5]} />

      {/* Publishing */}
      <Plant position={[2.5, 0, 5.5]} scale={0.9} />
      <Bookshelf position={[-0.5, 0, 2.2]} />

      {/* Lobby */}
      <Sofa position={[5, 0, 3.5]} />
      <CoffeeMachine position={[8.5, 0, 2.5]} />
      <Plant position={[4, 0, 5.5]} scale={1.3} />
      <Plant position={[8.5, 0, 5.5]} />
      <Plant position={[7, 0, 2.5]} scale={0.7} />
      <Bookshelf position={[8.5, 0, 4.5]} />
    </group>
  );
}
