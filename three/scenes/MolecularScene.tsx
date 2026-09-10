'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MolecularScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const rungsCount = 32;

  const helixData = useMemo(() => {
    const rungs = [];
    const radius = 0.55;
    const height = 3.6;
    const pitch = 2.4;

    for (let i = 0; i < rungsCount; i++) {
      const t = (i / rungsCount) * height - height / 2;
      const angle = (t / pitch) * Math.PI * 2;
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      rungs.push({
        y: t,
        p1: new THREE.Vector3(x1, t, z1),
        p2: new THREE.Vector3(x2, t, z2),
      });
    }
    return rungs;
  }, [rungsCount]);

  useFrame((state) => {
    if (groupRef.current) {
      // Very slow, disciplined rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {helixData.map((rung, i) => (
        <group key={i}>
          {/* Strand A Node (Matte Ceramic) */}
          <mesh position={rung.p1}>
            <sphereGeometry args={[0.042, 24, 24]} />
            <meshStandardMaterial color="#1E6861" roughness={0.25} metalness={0.1} />
          </mesh>

          {/* Strand B Node (Paper Ceramic) */}
          <mesh position={rung.p2}>
            <sphereGeometry args={[0.042, 24, 24]} />
            <meshStandardMaterial color="#EEEAE1" roughness={0.3} metalness={0.1} />
          </mesh>

          {/* Precision Machined Connector Wire */}
          {i % 2 === 0 && (
            <mesh
              position={[
                (rung.p1.x + rung.p2.x) / 2,
                rung.y,
                (rung.p1.z + rung.p2.z) / 2,
              ]}
              rotation={[0, -Math.atan2(rung.p2.z - rung.p1.z, rung.p2.x - rung.p1.x), 0]}
            >
              <cylinderGeometry args={[0.008, 0.008, 1.05, 8]} />
              <meshStandardMaterial color="#7A817D" roughness={0.4} metalness={0.5} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};
