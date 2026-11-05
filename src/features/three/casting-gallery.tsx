"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";

import { Figurine } from "./figurines/figurine";
import { type FigurinePose, figurineSpecs } from "./figurines/specs";
import { StageCanvas, usePrefersReducedMotion } from "./stage-canvas";

const POSES: Array<{ id: FigurinePose; label: string }> = [
  { id: "idle", label: "Repos" },
  { id: "speak", label: "Discours" },
  { id: "cheer", label: "Victoire" },
  { id: "wave", label: "Salut" },
  { id: "slump", label: "Défaite" },
  { id: "handshake", label: "Poignée de main" },
];

function Turntable({ children, still }: { children: React.ReactNode; still: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (still) {
      // Revient de face par le chemin le plus court.
      const y =
        (((ref.current.rotation.y % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      ref.current.rotation.y = y * Math.max(0, 1 - delta * 6);
    } else ref.current.rotation.y += delta * 0.35;
  });
  return <group ref={ref}>{children}</group>;
}

/** Planche de casting : une figurine en vitrine + sélection par nom (un seul contexte WebGL). */
export default function CastingGallery() {
  const specs = Object.values(figurineSpecs);
  const [selectedId, setSelectedId] = useState(specs[0]!.id);
  const [pose, setPose] = useState<FigurinePose>("idle");
  const [turn, setTurn] = useState(true);
  const reduced = usePrefersReducedMotion();
  const selected = figurineSpecs[selectedId] ?? specs[0]!;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-3">
        <StageCanvas
          label={`Figurine de ${selected.label}`}
          className="h-[62vh] min-h-[420px] w-full rounded-2xl bg-[radial-gradient(circle_at_50%_35%,#fbf6ee,#e8dccb)]"
          camera={{ position: [0, 1.7, 5.2], fov: 30 }}
          shadowScale={6}
        >
          <Turntable still={reduced || !turn}>
            <group position={[0, -1.05, 0]}>
              <Figurine spec={selected} pose={pose} still={reduced} />
            </group>
          </Turntable>
          <OrbitControls enablePan={false} minDistance={3} maxDistance={9} target={[0, 0.2, 0]} />
        </StageCanvas>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Pose">
          {POSES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPose(p.id)}
              aria-pressed={pose === p.id}
              className="min-h-11 rounded-full border border-[var(--ink-muted)]/30 px-4 text-sm font-semibold aria-pressed:bg-[var(--ink,#0b1b33)] aria-pressed:text-white"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTurn((v) => !v)}
            aria-pressed={turn}
            className="ml-auto min-h-11 rounded-full border px-4 text-sm"
          >
            {turn ? "Arrêter la rotation" : "Faire tourner"}
          </button>
        </div>
      </div>
      <ul
        className="grid grid-cols-2 gap-2 self-start sm:grid-cols-3 lg:grid-cols-2"
        aria-label="Candidats"
      >
        {specs.map((spec) => (
          <li key={spec.id}>
            <button
              type="button"
              onClick={() => setSelectedId(spec.id)}
              aria-pressed={spec.id === selectedId}
              className="flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm aria-pressed:border-transparent aria-pressed:bg-[var(--ink,#0b1b33)] aria-pressed:text-white"
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: spec.accent }}
                aria-hidden
              />
              {spec.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
