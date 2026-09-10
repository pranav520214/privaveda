'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SYSTEM_LAYERS } from '@/lib/content/privavedaData';

interface ArchitectureStackProps {
  selectedLayerIndex?: number;
  onSelectLayer?: (index: number) => void;
}

export const ArchitectureStackScene: React.FC<ArchitectureStackProps> = ({
  selectedLayerIndex = 0,
  onSelectLayer,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const layerSpacing = 0.44;
  const totalLayers = SYSTEM_LAYERS.length;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} rotation={[0.38, -0.45, 0]}>
      {SYSTEM_LAYERS.map((layer, idx) => {
        const yPos = (idx - totalLayers / 2) * layerSpacing;
        const isSelected = selectedLayerIndex === idx;
        const xOffset = isSelected ? 0.38 : 0;
        const zOffset = isSelected ? 0.12 : 0;

        return (
          <group
            key={layer.id}
            position={[xOffset, yPos, zOffset]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLayer?.(idx);
            }}
          >
            {/* Precision Optical Sapphire Wafer */}
            <mesh>
              <boxGeometry args={[3.2, 0.045, 2.0]} />
              <meshPhysicalMaterial
                color={isSelected ? '#1E6861' : '#F5F2EB'}
                emissive={isSelected ? '#1E6861' : '#000000'}
                emissiveIntensity={isSelected ? 0.45 : 0}
                roughness={0.12}
                transmission={isSelected ? 0.65 : 0.85}
                thickness={0.3}
                transparent
                opacity={isSelected ? 0.95 : 0.4}
                clearcoat={1}
                clearcoatRoughness={0.1}
              />
            </mesh>

            {/* Micro-milled Hairline Edges */}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(3.2, 0.045, 2.0)]} />
              <lineBasicMaterial
                color={isSelected ? '#AFCAC4' : '#7A817D'}
                transparent
                opacity={isSelected ? 0.9 : 0.25}
              />
            </lineSegments>

            {/* Precision Registration Index Node */}
            <mesh position={[-1.45, 0, 0.85]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? '#AFCAC4' : layer.color}
                emissive={isSelected ? '#AFCAC4' : layer.color}
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* Corner Alignment Pin Holes */}
            {[-1.5, 1.5].map((cx) =>
              [-0.9, 0.9].map((cz) => (
                <mesh key={`${cx}-${cz}`} position={[cx, 0, cz]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
                  <meshBasicMaterial color="#343B38" />
                </mesh>
              ))
            )}
          </group>
        );
      })}

      {/* Central Titanium Vertical Conduit Bus */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, totalLayers * layerSpacing + 0.6, 12]} />
        <meshStandardMaterial color="#1E6861" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 4 Corner Guide Rods (Mechanical Movement Metaphor) */}
      {[-1.5, 1.5].map((cx) =>
        [-0.9, 0.9].map((cz) => (
          <mesh key={`rod-${cx}-${cz}`} position={[cx, 0, cz]}>
            <cylinderGeometry args={[0.006, 0.006, totalLayers * layerSpacing + 0.4, 8]} />
            <meshBasicMaterial color="#343B38" transparent opacity={0.35} />
          </mesh>
        ))
      )}
    </group>
  );
};
