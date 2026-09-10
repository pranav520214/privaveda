'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WebGLFallback } from './WebGLFallback';

interface MainCanvasProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  enableControls?: boolean;
  className?: string;
}

class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const MainCanvas: React.FC<MainCanvasProps> = ({
  children,
  cameraPosition = [0, 0, 4.2],
  enableControls = false, // Disabled default spin/drag for clean cinematic composition!
  className = 'w-full h-full min-h-[380px]',
}) => {
  return (
    <ErrorBoundary fallback={<WebGLFallback />}>
      <div className={`relative ${className}`}>
        <Canvas
          camera={{ position: cameraPosition, fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Studio Product Lighting */}
          <ambientLight intensity={0.4} color="#F5F2EB" />
          {/* Primary Key Light (Soft, high angle) */}
          <directionalLight position={[4, 6, 4]} intensity={1.8} color="#FFFFFF" />
          {/* Secondary Fill (Warm shadow fill) */}
          <directionalLight position={[-4, -2, 2]} intensity={0.5} color="#EEEAE1" />
          {/* Subtle Rim / Contour Highlight */}
          <directionalLight position={[0, 4, -5]} intensity={0.9} color="#AFCAC4" />

          <Suspense fallback={null}>
            {children}
          </Suspense>

          {enableControls && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 2 + 0.2}
              minPolarAngle={Math.PI / 2 - 0.2}
              rotateSpeed={0.3}
            />
          )}
        </Canvas>
      </div>
    </ErrorBoundary>
  );
};
