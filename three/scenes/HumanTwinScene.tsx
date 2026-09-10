'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const HumanTwinScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const fluidParticlesRef = useRef<THREE.Points>(null);

  // Pharmacophore ligand core nodes (ceramic & deep mineral teal)
  const moleculeNodes = useMemo(() => [
    { pos: [0, 0, 0] as [number, number, number], r: 0.18, col: '#1E6861', roughness: 0.15 }, // Active core
    { pos: [0.45, 0.25, -0.1] as [number, number, number], r: 0.12, col: '#EEEAE1', roughness: 0.3 }, // Ligand atom
    { pos: [-0.45, 0.22, 0.1] as [number, number, number], r: 0.13, col: '#EEEAE1', roughness: 0.3 },
    { pos: [0.28, -0.42, 0.15] as [number, number, number], r: 0.11, col: '#AFCAC4', roughness: 0.25 },
    { pos: [-0.32, -0.38, -0.12] as [number, number, number], r: 0.12, col: '#EEEAE1', roughness: 0.3 },
    { pos: [0.85, 0.48, -0.2] as [number, number, number], r: 0.08, col: '#343B38', roughness: 0.4 },
    { pos: [-0.82, 0.45, 0.22] as [number, number, number], r: 0.08, col: '#343B38', roughness: 0.4 },
  ], []);

  // Molecular chemical bond cylinders
  const bonds = useMemo(() => [
    { p1: [0, 0, 0], p2: [0.45, 0.25, -0.1] },
    { p1: [0, 0, 0], p2: [-0.45, 0.22, 0.1] },
    { p1: [0, 0, 0], p2: [0.28, -0.42, 0.15] },
    { p1: [0, 0, 0], p2: [-0.32, -0.38, -0.12] },
    { p1: [0.45, 0.25, -0.1], p2: [0.85, 0.48, -0.2] },
    { p1: [-0.45, 0.22, 0.1], p2: [-0.82, 0.45, 0.22] },
  ], []);

  // Micro-fluidic particles drifting in suspension
  const { particlePositions } = useMemo(() => {
    const count = 180;
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pts[i * 3] = (Math.random() - 0.5) * 1.6;
      pts[i * 3 + 1] = (Math.random() - 0.5) * 2.6;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
    }
    return { particlePositions: pts };
  }, []);

  // Microscopic slow drift (no constant fast spinning!)
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      // Extremely subtle, microscopic Brownian drift
      groupRef.current.position.y = Math.sin(t * 0.4) * 0.035;
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.08;
      groupRef.current.rotation.x = Math.cos(t * 0.25) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Outer Optical Fluid Vessel / Micro-Chamber */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 2.9, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#F5F2EB"
          roughness={0.08}
          metalness={0.05}
          transmission={0.92}
          thickness={0.7}
          ior={1.38}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle Vessel Rim Collars */}
      <mesh position={[0, 1.45, 0]}>
        <torusGeometry args={[0.95, 0.015, 16, 64]} />
        <meshStandardMaterial color="#343B38" roughness={0.25} metalness={0.6} />
      </mesh>
      <mesh position={[0, -1.45, 0]}>
        <torusGeometry args={[0.95, 0.015, 16, 64]} />
        <meshStandardMaterial color="#343B38" roughness={0.25} metalness={0.6} />
      </mesh>

      {/* Molecular Ligand Structure (Ceramic & Mineral Teal) */}
      <group position={[0, 0.1, 0]}>
        {moleculeNodes.map((node, i) => (
          <mesh key={i} position={node.pos}>
            <sphereGeometry args={[node.r, 32, 32]} />
            <meshStandardMaterial
              color={node.col}
              roughness={node.roughness}
              metalness={0.1}
            />
          </mesh>
        ))}

        {/* Bond Cylinders */}
        {bonds.map((bond, i) => {
          const v1 = new THREE.Vector3(...(bond.p1 as [number, number, number]));
          const v2 = new THREE.Vector3(...(bond.p2 as [number, number, number]));
          const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
          const dir = new THREE.Vector3().subVectors(v2, v1);
          const len = dir.length();
          const orientation = new THREE.Matrix4();
          orientation.lookAt(v1, v2, new THREE.Vector3(0, 1, 0));

          return (
            <mesh key={i} position={mid}>
              <cylinderGeometry args={[0.016, 0.016, len, 16]} />
              <meshStandardMaterial color="#7A817D" roughness={0.3} metalness={0.4} />
            </mesh>
          );
        })}
      </group>

      {/* Floating Micro-Fluidic In-Suspension Particles */}
      <points ref={fluidParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.022}
          color="#1E6861"
          transparent
          opacity={0.5}
          sizeAttenuation
        />
      </points>
    </group>
  );
};
