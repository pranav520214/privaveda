'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CompartmentProps {
  modelType?: '1-Compartment' | '2-Compartment';
}

export const CompartmentScene: React.FC<CompartmentProps> = ({
  modelType = '1-Compartment',
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 90;

  const particleData = useMemo(() => {
    const pts = new Float32Array(count * 3);
    const routes: { progress: number; speed: number; channel: 'gut' | 'central' | 'elim' }[] = [];

    for (let i = 0; i < count; i++) {
      const channel = i < 30 ? 'gut' : (i < 70 ? 'central' : 'elim');
      pts[i * 3] = (Math.random() - 0.5) * 0.8;
      pts[i * 3 + 1] = (Math.random() - 0.5) * 1.2;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      routes.push({
        progress: Math.random(),
        speed: 0.08 + Math.random() * 0.08,
        channel,
      });
    }
    return { pts, routes };
  }, [count]);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const r = particleData.routes[i];
        r.progress = (r.progress + r.speed * delta) % 1;

        if (r.channel === 'gut') {
          // Flow from Gut (-1.8, 0.4) toward Central (0, 0)
          pos[i * 3] = -1.8 + r.progress * 1.8;
          pos[i * 3 + 1] = 0.4 - r.progress * 0.4 + (Math.sin(r.progress * Math.PI) * 0.1);
        } else if (r.channel === 'elim') {
          // Flow from Central downward to Clearance (0, -1.6)
          pos[i * 3] = (Math.sin(r.progress * 8) * 0.08);
          pos[i * 3 + 1] = -r.progress * 1.6;
        } else {
          // Central circulation
          pos[i * 3] = Math.sin(state.clock.elapsedTime * 0.6 + i) * 0.35;
          pos[i * 3 + 1] = Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.45;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* 01 / Absorption Depot (Gut Vessel) */}
      <group position={[-1.8, 0.4, 0]}>
        <mesh>
          <cylinderGeometry args={[0.38, 0.38, 1.4, 32]} />
          <meshPhysicalMaterial
            color="#F5F2EB"
            roughness={0.1}
            transmission={0.93}
            thickness={0.5}
            ior={1.35}
            transparent
            opacity={0.4}
          />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <torusGeometry args={[0.38, 0.012, 16, 48]} />
          <meshStandardMaterial color="#343B38" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* 02 / Central Distribution Vessel V_1 (Large Optical Glass Cylinder) */}
      <group position={[0, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.65, 0.65, 1.9, 36]} />
          <meshPhysicalMaterial
            color="#F5F2EB"
            roughness={0.08}
            transmission={0.94}
            thickness={0.7}
            ior={1.42}
            transparent
            opacity={0.45}
          />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <torusGeometry args={[0.65, 0.014, 16, 48]} />
          <meshStandardMaterial color="#343B38" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* 03 / Peripheral Vessel V_2 (Secondary Vessel in Depth) */}
      {modelType === '2-Compartment' && (
        <group position={[1.8, 0.5, -0.6]}>
          <mesh>
            <cylinderGeometry args={[0.42, 0.42, 1.5, 32]} />
            <meshPhysicalMaterial
              color="#F5F2EB"
              roughness={0.1}
              transmission={0.92}
              thickness={0.5}
              ior={1.35}
              transparent
              opacity={0.35}
            />
          </mesh>
        </group>
      )}

      {/* 04 / Clearance Output Path (Precision Drain Funnel) */}
      <group position={[0, -1.6, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.45, 0.7, 32]} />
          <meshPhysicalMaterial
            color="#F5F2EB"
            roughness={0.1}
            transmission={0.9}
            thickness={0.4}
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>

      {/* Precision Machined Capillary Conduits */}
      {/* Gut -> Central Conduit */}
      <mesh position={[-0.9, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.0, 16]} />
        <meshStandardMaterial color="#343B38" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Central -> Clearance Drain Conduit */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 16]} />
        <meshStandardMaterial color="#343B38" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Fluid Particles Stream */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.pts, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#1E6861"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>
    </group>
  );
};
