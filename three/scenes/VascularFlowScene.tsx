'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const VascularFlowScene: React.FC = () => {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const drugRef = useRef<THREE.InstancedMesh>(null);
  const count = 75;
  const drugCount = 40;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particleData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      progress: Math.random(),
      speed: 0.08 + Math.random() * 0.1, // Slow, calm cinematic motion
      radius: 0.1 + Math.random() * 0.45,
      angle: Math.random() * Math.PI * 2,
      scale: 0.045 + Math.random() * 0.02,
      rotSpeed: 0.2 + Math.random() * 0.5,
    }));
  }, [count]);

  const drugData = useMemo(() => {
    return Array.from({ length: drugCount }, () => ({
      progress: Math.random(),
      speed: 0.12 + Math.random() * 0.12,
      radius: 0.08 + Math.random() * 0.35,
      angle: Math.random() * Math.PI * 2,
      scale: 0.022 + Math.random() * 0.015,
    }));
  }, [drugCount]);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particleData.forEach((p, i) => {
        p.progress = (p.progress + p.speed * delta) % 1;
        const z = (p.progress - 0.5) * 6;
        const x = Math.sin(z * 1.0) * 0.25 + Math.cos(p.angle) * p.radius;
        const y = Math.cos(z * 0.8) * 0.15 + Math.sin(p.angle) * p.radius;

        dummy.position.set(x, y, z);
        dummy.rotation.x += delta * p.rotSpeed;
        dummy.rotation.z += delta * p.rotSpeed * 0.5;
        dummy.scale.set(p.scale, p.scale * 0.35, p.scale);
        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (drugRef.current) {
      drugData.forEach((d, i) => {
        d.progress = (d.progress + d.speed * delta) % 1;
        const z = (d.progress - 0.5) * 6;
        const x = Math.sin(z * 1.0) * 0.25 + Math.cos(d.angle) * d.radius;
        const y = Math.cos(z * 0.8) * 0.15 + Math.sin(d.angle) * d.radius;

        dummy.position.set(x, y, z);
        dummy.scale.set(d.scale, d.scale, d.scale);
        dummy.updateMatrix();
        drugRef.current!.setMatrixAt(i, dummy.matrix);
      });
      drugRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]} rotation={[0.15, 0.35, 0]}>
      {/* Outer Vascular Endothelial Wall (Quartz/Glass finish) */}
      <mesh>
        <cylinderGeometry args={[0.75, 0.75, 6.2, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#F5F2EB"
          roughness={0.12}
          transmission={0.92}
          thickness={0.5}
          ior={1.33}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Erythrocytes (Subdued Organic Red) */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#991B1B"
          roughness={0.45}
          metalness={0.05}
        />
      </instancedMesh>

      {/* Circulating Drug Molecules (Deep Mineral Teal & Soft Clinical Green) */}
      <instancedMesh ref={drugRef} args={[undefined, undefined, drugCount]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#1E6861"
          roughness={0.2}
          metalness={0.3}
        />
      </instancedMesh>
    </group>
  );
};
