"use client";

import { Center, OrbitControls, useGLTF } from "@react-three/drei";

import { Figurine } from "./figurines/figurine";
import { figurineSpecs } from "./figurines/specs";
import { StageCanvas, usePrefersReducedMotion } from "./stage-canvas";

/**
 * Essai V3 : modèles générés par IA (Higgsfield / SAM 3D, 1 crédit chacun) à partir des
 * rendus procéduraux, comparés aux figurines codées. Statiques (non riggés).
 */
function AiModel({ url, x }: { url: string; x: number }) {
  const { scene } = useGLTF(url);
  return (
    <group position={[x, 0.95, 0]}>
      <Center>
        <primitive object={scene} scale={1.9} />
      </Center>
    </group>
  );
}

export default function AiTrial() {
  const still = usePrefersReducedMotion();
  return (
    <StageCanvas
      label="Comparaison : figurines procédurales et modèles générés par IA"
      className="h-[50vh] min-h-[360px] w-full rounded-2xl bg-[#efe7da]"
      camera={{ position: [0, 1.6, 7.5], fov: 34 }}
      shadowY={-0.05}
      shadowScale={16}
    >
      <group position={[-3, -0.05, 0]}>
        <Figurine spec={figurineSpecs.le_pen!} still={still} />
      </group>
      <AiModel url="/models/ai-trial/le_pen.glb" x={-1} />
      <group position={[1, -0.05, 0]}>
        <Figurine spec={figurineSpecs.melenchon!} still={still} phase={1} />
      </group>
      <AiModel url="/models/ai-trial/melenchon.glb" x={3} />
      <OrbitControls enablePan={false} target={[0, 0.8, 0]} />
    </StageCanvas>
  );
}
