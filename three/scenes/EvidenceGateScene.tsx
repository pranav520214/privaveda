'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EvidenceGateProps {
  gateState?: 'REVIEWABLE_ZERO_BLOCKS' | 'CAUTION_FLAGS_PRESENT' | 'SIMULATION_ABSTAINED';
}

export const EvidenceGateScene: React.FC<EvidenceGateProps> = ({
  gateState = 'REVIEWABLE_ZERO_BLOCKS',
}) => {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const dialRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // Oscillating coherent laser scanner
    if (beamRef.current) {
      beamRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.2) * 1.15;
    }
    // High-precision vernier rotation
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
    }
    if (dialRef.current) {
      dialRef.current.rotation.z -= delta * 0.08;
    }
  });

  const stateColor =
    gateState === 'REVIEWABLE_ZERO_BLOCKS'
      ? '#1E6861'
      : gateState === 'CAUTION_FLAGS_PRESENT'
      ? '#D97706'
      : '#991B1B';

  const isAbstained = gateState === 'SIMULATION_ABSTAINED';

  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      {/* Outer Machined Titanium Ring */}
      <mesh>
        <torusGeometry args={[1.75, 0.04, 16, 64]} />
        <meshStandardMaterial
          color="#1A211E"
          metalness={0.88}
          roughness={0.2}
        />
      </mesh>

      {/* Internal Precision Vernier Scale Ring */}
      <group ref={dialRef}>
        <mesh>
          <torusGeometry args={[1.62, 0.015, 12, 48]} />
          <meshBasicMaterial color="#343B38" wireframe />
        </mesh>
        {/* 12 Vernier Tick Marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 1.62, Math.sin(angle) * 1.62, 0]}
              rotation={[0, 0, angle]}
            >
              <boxGeometry args={[0.08, 0.015, 0.02]} />
              <meshBasicMaterial color="#7A817D" />
            </mesh>
          );
        })}
      </group>

      {/* Counter-rotating Sensor Guidance Ring */}
      <group ref={ringRef}>
        <mesh>
          <torusGeometry args={[1.42, 0.02, 16, 64]} />
          <meshStandardMaterial
            color={stateColor}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Optical Quartz Translucent Inspection Disk */}
      <mesh>
        <circleGeometry args={[1.38, 48]} />
        <meshPhysicalMaterial
          color={isAbstained ? '#7F1D1D' : '#F5F2EB'}
          roughness={0.08}
          transmission={isAbstained ? 0.45 : 0.88}
          thickness={0.3}
          transparent
          opacity={isAbstained ? 0.75 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Precision Collimated Laser Beam Plane */}
      {!isAbstained && (
        <mesh ref={beamRef}>
          <boxGeometry args={[2.7, 0.015, 0.8]} />
          <meshBasicMaterial
            color={stateColor}
            transparent
            opacity={0.45}
          />
        </mesh>
      )}

      {/* Abstention Interlock Blades (Mechanical Iris Shutter) */}
      {isAbstained && (
        <group position={[0, 0, 0.05]}>
          {/* Shutter Blades */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <mesh key={i} rotation={[0, 0, angle + 0.3]} position={[0, 0, 0.02]}>
              <boxGeometry args={[1.4, 0.7, 0.02]} />
              <meshStandardMaterial
                color="#0E1715"
                metalness={0.7}
                roughness={0.4}
              />
            </mesh>
          ))}
          {/* Central Red Warning Seal */}
          <mesh position={[0, 0, 0.08]}>
            <ringGeometry args={[0.25, 0.34, 32]} />
            <meshBasicMaterial color="#991B1B" />
          </mesh>
          <mesh position={[0, 0, 0.09]}>
            <circleGeometry args={[0.22, 32]} />
            <meshBasicMaterial color="#7F1D1D" />
          </mesh>
        </group>
      )}

      {/* Microscopic Center Target Reticle */}
      <group position={[0, 0, 0.02]}>
        <mesh>
          <ringGeometry args={[0.08, 0.09, 32]} />
          <meshBasicMaterial color={stateColor} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.3, 0.008, 0.01]} />
          <meshBasicMaterial color={stateColor} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.008, 0.3, 0.01]} />
          <meshBasicMaterial color={stateColor} />
        </mesh>
      </group>
    </group>
  );
};
