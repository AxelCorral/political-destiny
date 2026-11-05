"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

import type { CampaignTheme, RegionId } from "@/game/types";

/**
 * France en diorama miniature : huit tuiles régionales arrondies posées sur un socle,
 * hameaux, arbres et repères, dans l'esprit des maquettes isométriques de scroll-world.
 * Coordonnées : x vers l'est, z vers le sud.
 */
export const REGION_LAYOUT: Record<
  RegionId,
  { x: number; z: number; w: number; d: number; color: string }
> = {
  north: { x: 0.2, z: -2.3, w: 1.5, d: 0.9, color: "#a9c98f" },
  ile_de_france: { x: 0.2, z: -1.2, w: 0.95, d: 0.85, color: "#cbbf9f" },
  east: { x: 1.65, z: -1.3, w: 1.2, d: 1.5, color: "#9fc490" },
  west: { x: -1.5, z: -0.75, w: 1.5, d: 1.3, color: "#b4d39b" },
  central: { x: 0.15, z: 0.15, w: 1.55, d: 1.45, color: "#c2d6a0" },
  south_west: { x: -1.3, z: 1.55, w: 1.45, d: 1.4, color: "#d4cf96" },
  south_east: { x: 1.45, z: 1.45, w: 1.6, d: 1.5, color: "#dcc99a" },
  overseas: { x: -3.1, z: 2.45, w: 0.7, d: 0.55, color: "#9bd1c4" },
};

export function regionTop(region: RegionId): [number, number, number] {
  const r = REGION_LAYOUT[region];
  return [r.x, 0.32, r.z];
}

function pseudo(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.12, 6]} />
        <meshStandardMaterial color="#7a5a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow>
        <coneGeometry args={[0.075, 0.2, 7]} />
        <meshStandardMaterial color="#4f8a4a" roughness={0.7} />
      </mesh>
    </group>
  );
}

function House({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.11, 0.1, 0.09]} />
        <meshStandardMaterial color="#f3ecdf" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.09, 0.07, 4]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Landmarks() {
  const p = REGION_LAYOUT.ile_de_france;
  return (
    <group position={[p.x + 0.25, 0.3, p.z - 0.15]}>
      {/* Tour stylisée */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.07 + i * 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.07 - i * 0.02, 0.14, 4]} />
          <meshStandardMaterial color="#8a7b66" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/** Tuiles, décor statique. Les props dynamiques (chocs, foules, figurines) sont posées par-dessus. */
export function FranceDiorama({ highlight = [] }: { highlight?: RegionId[] }) {
  const decor = useMemo(() => {
    const items: Array<{ kind: "tree" | "house"; pos: [number, number, number]; c: string }> = [];
    let seed = 1;
    for (const [id, r] of Object.entries(REGION_LAYOUT)) {
      if (id === "overseas") continue;
      for (let i = 0; i < 6; i += 1) {
        seed += 1;
        const x = r.x + (pseudo(seed) - 0.5) * r.w * 0.75;
        const z = r.z + (pseudo(seed + 50) - 0.5) * r.d * 0.75;
        // Laisse le centre de chaque tuile libre pour les figurines et les props.
        if (Math.abs(x - r.x) < 0.22 && Math.abs(z - r.z) < 0.22) continue;
        items.push({
          kind: pseudo(seed + 9) > 0.55 ? "house" : "tree",
          pos: [x, 0.3, z],
          c: pseudo(seed + 3) > 0.5 ? "#c4583f" : "#5b6f8f",
        });
      }
    }
    return items;
  }, []);

  return (
    <group>
      {/* Socle de la maquette */}
      <RoundedBox
        args={[7.4, 0.3, 6.6]}
        radius={0.12}
        smoothness={4}
        position={[-0.3, -0.05, 0.05]}
        receiveShadow
      >
        <meshStandardMaterial color="#e9dcc6" roughness={0.9} />
      </RoundedBox>
      <mesh position={[-0.3, 0.105, 0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7.1, 6.3]} />
        <meshStandardMaterial color="#9fcbe0" roughness={0.3} />
      </mesh>
      {(Object.entries(REGION_LAYOUT) as Array<[RegionId, (typeof REGION_LAYOUT)[RegionId]]>).map(
        ([id, r]) => (
          <RoundedBox
            key={id}
            args={[r.w, 0.22, r.d]}
            radius={0.08}
            smoothness={3}
            position={[r.x, 0.2, r.z]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={highlight.includes(id) ? "#f0a35e" : r.color}
              roughness={0.75}
            />
          </RoundedBox>
        ),
      )}
      {decor.map((item, i) =>
        item.kind === "tree" ? (
          <Tree key={i} position={item.pos} scale={0.8 + pseudo(i) * 0.5} />
        ) : (
          <House key={i} position={item.pos} color={item.c} />
        ),
      )}
      <Landmarks />
    </group>
  );
}

/** Petite foule animée avec pancartes, pour les régions en mouvement social. */
export function ProtestCrowd({
  region,
  color = "#e85d04",
  still,
}: {
  region: RegionId;
  color?: string;
  still: boolean;
}) {
  const group = useRef<Group>(null);
  const [x, y, z] = regionTop(region);
  const people = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        dx: (pseudo(i + region.length) - 0.5) * 0.5,
        dz: (pseudo(i * 7 + region.length) - 0.5) * 0.4,
        sign: i % 3 === 0,
        phase: i * 0.7,
      })),
    [region],
  );
  useFrame((state) => {
    if (!group.current || still) return;
    group.current.children.forEach((child, i) => {
      child.position.y =
        Math.abs(Math.sin(state.clock.elapsedTime * 4 + (people[i]?.phase ?? 0))) * 0.04;
    });
  });
  return (
    <group position={[x, y, z + 0.18]} ref={group}>
      {people.map((p, i) => (
        <group key={i} position={[p.dx, 0, p.dz]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <capsuleGeometry args={[0.025, 0.06, 4, 8]} />
            <meshStandardMaterial color={i % 2 ? "#3c4a63" : "#6b5b4b"} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#e8b48d" />
          </mesh>
          {p.sign && (
            <mesh position={[0.02, 0.22, 0]}>
              <boxGeometry args={[0.1, 0.06, 0.008]} />
              <meshStandardMaterial color={color} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Repère visuel d'un choc extérieur, posé sur une région significative. */
export function ShockMarker({ theme, still }: { theme: CampaignTheme; still: boolean }) {
  const flame = useRef<Mesh>(null);
  useFrame((state) => {
    if (flame.current && !still) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 9) * 0.12;
      flame.current.scale.set(s, 1 + Math.sin(state.clock.elapsedTime * 7) * 0.2, s);
    }
  });
  const place: Record<CampaignTheme, RegionId> = {
    economy: "central",
    security: "ile_de_france",
    ecology: "south_west",
    services: "west",
    europe: "east",
    social: "north",
  };
  const [x, y, z] = regionTop(place[theme]);
  const at: [number, number, number] = [x - 0.35, y, z - 0.2];
  switch (theme) {
    case "economy":
      // Pompe à carburant et panneau de prix rouge.
      return (
        <group position={at}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.1, 0.24, 0.08]} />
            <meshStandardMaterial color="#d33f2f" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.17, 0.042]}>
            <boxGeometry args={[0.07, 0.05, 0.005]} />
            <meshStandardMaterial color="#fff6c2" emissive="#ffcf3a" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.12, 0.32, 0]} castShadow>
            <boxGeometry args={[0.18, 0.1, 0.02]} />
            <meshStandardMaterial color="#1b1b1f" emissive="#ff3b30" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.12, 0.17, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      );
    case "ecology":
      return (
        <group position={at}>
          <mesh ref={flame} position={[0, 0.12, 0]}>
            <coneGeometry args={[0.09, 0.26, 8]} />
            <meshStandardMaterial
              color="#ff8a1f"
              emissive="#ff5a00"
              emissiveIntensity={1.1}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[0.12, 0.08, 0.05]}>
            <coneGeometry args={[0.05, 0.15, 8]} />
            <meshStandardMaterial color="#ffb02e" emissive="#ff7a00" emissiveIntensity={1} />
          </mesh>
        </group>
      );
    case "security":
      // Bougies de recueillement : sobres, sans aucune représentation de violence.
      return (
        <group position={at}>
          {[-0.08, 0, 0.08].map((dx, i) => (
            <group key={i} position={[dx, 0, i % 2 ? 0.05 : 0]}>
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.1, 10]} />
                <meshStandardMaterial color="#f7f2e8" />
              </mesh>
              <mesh position={[0, 0.115, 0]}>
                <sphereGeometry args={[0.013, 8, 8]} />
                <meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={1.5} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "services":
      return (
        <group position={at}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.22, 0.2, 0.14]} />
            <meshStandardMaterial color="#f4f6f8" />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <boxGeometry args={[0.1, 0.03, 0.02]} />
            <meshStandardMaterial color="#d62828" emissive="#d62828" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <boxGeometry args={[0.03, 0.1, 0.02]} />
            <meshStandardMaterial color="#d62828" emissive="#d62828" emissiveIntensity={0.4} />
          </mesh>
        </group>
      );
    case "europe":
      return (
        <group position={at}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.36, 6]} />
            <meshStandardMaterial color="#888" />
          </mesh>
          <mesh position={[0.08, 0.3, 0]}>
            <boxGeometry args={[0.16, 0.1, 0.005]} />
            <meshStandardMaterial color="#003399" />
          </mesh>
          <mesh position={[0.08, 0.3, 0.004]}>
            <torusGeometry args={[0.03, 0.006, 6, 16]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.4} />
          </mesh>
        </group>
      );
    case "social":
      // Usine avec cheminée.
      return (
        <group position={at}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.26, 0.16, 0.14]} />
            <meshStandardMaterial color="#9a8f86" />
          </mesh>
          <mesh position={[0.08, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.03, 0.22, 8]} />
            <meshStandardMaterial color="#7a6a60" />
          </mesh>
        </group>
      );
  }
}
