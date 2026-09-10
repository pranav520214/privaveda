'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface BayesianSurfaceProps {
  hasObservation?: boolean;
}

export const BayesianSurfaceScene: React.FC<BayesianSurfaceProps> = ({
  hasObservation = true,
}) => {
  // Prior distribution: broad variance (sigma = 1.15)
  const priorMesh = useMemo(() => {
    const size = 54;
    const geo = new THREE.PlaneGeometry(3.6, 3.6, size, size);
    const pos = geo.attributes.position;
    const sigma = 1.15;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const distSq = x * x + y * y;
      const z = Math.exp(-distSq / (2 * sigma * sigma)) * 0.95;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Posterior distribution: contracted variance (sigma = 0.48)
  const posteriorMesh = useMemo(() => {
    const size = 54;
    const geo = new THREE.PlaneGeometry(3.6, 3.6, size, size);
    const pos = geo.attributes.position;
    const sigma = 0.48;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const distSq = (x - 0.22) * (x - 0.22) + y * y;
      const z = Math.exp(-distSq / (2 * sigma * sigma)) * 1.85;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group position={[0, -0.4, 0]} rotation={[-Math.PI / 3, 0, 0]}>
      {/* Precision Mathematical Ground Grid */}
      <gridHelper args={[4, 16, '#1E6861', '#0B332F']} rotation={[Math.PI / 2, 0, 0]} />

      {/* Prior Distribution Surface (Graphite Wireframe Sculpture) */}
      <mesh geometry={priorMesh}>
        <meshStandardMaterial
          color="#343B38"
          roughness={0.5}
          metalness={0.1}
          transparent
          opacity={hasObservation ? 0.25 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments>
        <wireframeGeometry args={[priorMesh]} />
        <lineBasicMaterial color="#343B38" transparent opacity={0.3} />
      </lineSegments>

      {/* Posterior Distribution Surface (Mineral Teal Architectural Peak) */}
      {hasObservation && (
        <group>
          <mesh geometry={posteriorMesh}>
            <meshStandardMaterial
              color="#1E6861"
              roughness={0.2}
              metalness={0.2}
              transparent
              opacity={0.82}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments>
            <wireframeGeometry args={[posteriorMesh]} />
            <lineBasicMaterial color="#AFCAC4" transparent opacity={0.7} />
          </lineSegments>

          {/* Observation Precision Needle */}
          <group position={[0.22, 0, 1.85]}>
            <mesh>
              <sphereGeometry args={[0.045, 24, 24]} />
              <meshBasicMaterial color="#DC2626" />
            </mesh>
            <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 1.8, 8]} />
              <meshBasicMaterial color="#DC2626" />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
};
