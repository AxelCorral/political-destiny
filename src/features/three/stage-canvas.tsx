"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { type ReactNode, Suspense, useSyncExternalStore } from "react";

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

let webglSupport: boolean | undefined;
export function hasWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    webglSupport = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

const noop = () => () => {};
export function useWebGL(): boolean {
  return useSyncExternalStore(noop, hasWebGL, () => false);
}

interface StageCanvasProps {
  children: ReactNode;
  camera?: { position: [number, number, number]; fov?: number; zoom?: number };
  orthographic?: boolean;
  className?: string;
  shadowY?: number;
  shadowScale?: number;
  fallback?: ReactNode;
  /** Étiquette accessible : la scène est décorative, le texte reste dans le DOM. */
  label: string;
}

/**
 * Canevas commun : lumière « studio miniature » douce, ombres de contact, DPR plafonné
 * pour rester fluide sur mobile. Si WebGL est absent, affiche `fallback`.
 */
export function StageCanvas({
  children,
  camera = { position: [0, 2.2, 6.5], fov: 32 },
  orthographic = false,
  className,
  shadowY = 0,
  shadowScale = 12,
  fallback = null,
  label,
}: StageCanvasProps) {
  const webgl = useWebGL();
  if (!webgl) return <>{fallback}</>;
  return (
    <div className={className} role="img" aria-label={label}>
      <Canvas
        orthographic={orthographic}
        camera={camera}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        <hemisphereLight args={["#fff6ea", "#b9c7d9", 0.9]} />
        <directionalLight
          position={[4, 7, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
          color="#fff1dc"
        />
        <directionalLight position={[-5, 3, -2]} intensity={0.45} color="#c9dcff" />
        <Suspense fallback={null}>{children}</Suspense>
        <ContactShadows
          position={[0, shadowY, 0]}
          opacity={0.35}
          scale={shadowScale}
          blur={2.4}
          far={3}
        />
      </Canvas>
    </div>
  );
}
