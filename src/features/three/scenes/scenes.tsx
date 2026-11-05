"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { CampaignTheme, RegionId } from "@/game/types";

import { Figurine } from "../figurines/figurine";
import type { FigurinePose, FigurineSpec } from "../figurines/specs";
import { StageCanvas, usePrefersReducedMotion } from "../stage-canvas";
import { FranceDiorama, ProtestCrowd, regionTop, ShockMarker } from "./diorama";

/** Légère dérive de caméra façon maquette filmée. */
function Drift({
  children,
  amplitude = 0.18,
  still,
}: {
  children: React.ReactNode;
  amplitude?: number;
  still: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current || still) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * amplitude;
  });
  return <group ref={ref}>{children}</group>;
}

// ——— Campagne : la France en diorama ———

export interface CampaignSceneProps {
  player: FigurineSpec;
  playerRegion: RegionId;
  playerPose: FigurinePose;
  rivals: Array<{ spec: FigurineSpec; region: RegionId }>;
  shocks: CampaignTheme[];
  protestRegions: RegionId[];
  label: string;
}

export function CampaignScene({
  player,
  playerRegion,
  playerPose,
  rivals,
  shocks,
  protestRegions,
  label,
}: CampaignSceneProps) {
  const still = usePrefersReducedMotion();
  const [px, py, pz] = regionTop(playerRegion);
  return (
    <StageCanvas
      label={label}
      className="h-full w-full"
      camera={{ position: [0.2, 4.4, 5.6], fov: 38 }}
      shadowY={0.11}
      shadowScale={14}
    >
      <color attach="background" args={["#f3ebdd"]} />
      <fog attach="fog" args={["#f3ebdd", 10, 18]} />
      <Drift still={still}>
        <group position={[0.35, -0.75, -0.2]}>
          <FranceDiorama highlight={protestRegions} />
          {protestRegions.map((region) => (
            <ProtestCrowd key={region} region={region} still={still} />
          ))}
          {shocks.map((theme) => (
            <ShockMarker key={theme} theme={theme} still={still} />
          ))}
          {rivals.map(({ spec, region }, index) => {
            const [x, y, z] = regionTop(region);
            return (
              <group key={spec.id} position={[x + 0.3, y, z + 0.1]} scale={0.5}>
                <Figurine
                  spec={spec}
                  pose={index === 0 ? "speak" : "idle"}
                  phase={index * 1.3}
                  still={still}
                />
              </group>
            );
          })}
          <group position={[px, py, pz]} scale={0.78}>
            <Figurine spec={player} pose={playerPose} still={still} />
          </group>
        </group>
      </Drift>
    </StageCanvas>
  );
}

// ——— Débat télévisé ———

function Lectern({ color, x }: { color: string; x: number }) {
  return (
    <group position={[x, 0, 0.55]}>
      <RoundedBox args={[0.7, 0.9, 0.4]} radius={0.05} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#1b2340" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.55, 0.205]}>
        <planeGeometry args={[0.55, 0.18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

/** Pivot des candidats l'un vers l'autre, en alternance (doit vivre dans le Canvas). */
function Facing({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const speaker = Math.floor(state.clock.elapsedTime / 3) % 2;
    ref.current.rotation.y =
      side === "left" ? 0.45 + (speaker === 0 ? 0.15 : 0) : -0.45 - (speaker === 1 ? 0.15 : 0);
  });
  return <group ref={ref}>{children}</group>;
}

export function DebateScene({
  left,
  right,
  label,
}: {
  left: FigurineSpec;
  right: FigurineSpec;
  label: string;
}) {
  const still = usePrefersReducedMotion();
  const leftSpeaks = !still;
  return (
    <StageCanvas
      label={label}
      className="h-full w-full"
      camera={{ position: [0, 1.6, 7], fov: 32 }}
      shadowY={-1.05}
      shadowScale={10}
    >
      <color attach="background" args={["#0e1630"]} />
      {/* Plateau : sol, écran de fond et anneau lumineux */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
        <circleGeometry args={[4, 48]} />
        <meshStandardMaterial color="#1c2a52" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.04, 0]}>
        <ringGeometry args={[2.4, 2.5, 64]} />
        <meshStandardMaterial color="#4c83cb" emissive="#4c83cb" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 1.6, -2]}>
        <planeGeometry args={[7, 3]} />
        <meshStandardMaterial color="#20366e" emissive="#162a5a" emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 3, 2]} intensity={6} color="#9cc0ff" />
      <group position={[0, -1.05, 0]}>
        <group position={[-1.3, 0, 0]}>
          <Facing side="left">
            <Figurine spec={left} pose={leftSpeaks ? "speak" : "idle"} still={still} />
          </Facing>
        </group>
        <group position={[1.3, 0, 0]}>
          <Facing side="right">
            <Figurine spec={right} pose="idle" phase={1.5} still={still} />
          </Facing>
        </group>
        <Lectern color={left.accent} x={-1.3} />
        <Lectern color={right.accent} x={1.3} />
      </group>
    </StageCanvas>
  );
}

// ——— Soirée électorale : podium ———

export function PodiumScene({
  entries,
  playerId,
  label,
}: {
  entries: Array<{ spec: FigurineSpec; partyId: string; score: number }>;
  playerId: string;
  label: string;
}) {
  const still = usePrefersReducedMotion();
  const top = entries.slice(0, 4);
  const max = Math.max(...top.map((entry) => entry.score), 1);
  const order = [1, 0, 2, 3].filter((index) => index < top.length);
  return (
    <StageCanvas
      label={label}
      className="h-full w-full"
      camera={{ position: [0, 2.6, 7.4], fov: 32 }}
      shadowScale={12}
    >
      <color attach="background" args={["#0b1730"]} />
      <pointLight position={[0, 4, 3]} intensity={10} color="#ffe2a6" />
      {order.map((rankIndex, slot) => {
        const entry = top[rankIndex]!;
        const height = 0.25 + (entry.score / max) * 1.2;
        const x = (slot - (order.length - 1) / 2) * 1.5;
        const winner = rankIndex === 0;
        const isPlayer = entry.partyId === playerId;
        const pose: FigurinePose = winner
          ? "cheer"
          : isPlayer
            ? "slump"
            : rankIndex === 1
              ? "wave"
              : "idle";
        return (
          <group key={entry.partyId} position={[x, -1.4, 0]}>
            <RoundedBox
              args={[1.2, height, 1]}
              radius={0.06}
              position={[0, height / 2, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={winner ? "#d2ad62" : "#e9e2d4"}
                roughness={0.45}
                metalness={winner ? 0.35 : 0}
              />
            </RoundedBox>
            <group position={[0, height, 0]} scale={0.85}>
              <Figurine spec={entry.spec} pose={pose} phase={slot} still={still} />
            </group>
          </group>
        );
      })}
    </StageCanvas>
  );
}

// ——— Élysée ———

export function ElyseeScene({
  player,
  won,
  label,
}: {
  player: FigurineSpec;
  won: boolean;
  label: string;
}) {
  const still = usePrefersReducedMotion();
  return (
    <StageCanvas
      label={label}
      className="h-full w-full"
      camera={{ position: [0, 1.4, 8.2], fov: 34 }}
      shadowY={-1.1}
      shadowScale={12}
    >
      <color attach="background" args={[won ? "#f6efe2" : "#dfe3ea"]} />
      <group position={[0, -1.1, 0]}>
        {/* Cour pavée */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[14, 10]} />
          <meshStandardMaterial color="#d8cdb9" roughness={0.9} />
        </mesh>
        {/* Tapis rouge */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.8]}>
          <planeGeometry args={[1, 4]} />
          <meshStandardMaterial color="#9b1b1f" roughness={0.8} />
        </mesh>
        {/* Façade stylisée */}
        <group position={[0, 0, -1.8]}>
          <RoundedBox
            args={[7, 2.4, 0.8]}
            radius={0.04}
            position={[0, 1.2, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#efe8da" roughness={0.7} />
          </RoundedBox>
          <mesh position={[0, 2.55, 0]} castShadow>
            <boxGeometry args={[7.3, 0.3, 1]} />
            <meshStandardMaterial color="#6f7d8f" roughness={0.6} />
          </mesh>
          {[-1.2, -0.4, 0.4, 1.2].map((x) => (
            <mesh key={x} position={[x, 1, 0.5]} castShadow>
              <cylinderGeometry args={[0.1, 0.12, 2, 14]} />
              <meshStandardMaterial color="#f7f3ea" roughness={0.5} />
            </mesh>
          ))}
          {[-3, -2.2, 2.2, 3].map((x) => (
            <mesh key={x} position={[x, 1.25, 0.41]}>
              <planeGeometry args={[0.45, 0.8]} />
              <meshStandardMaterial color="#5a6b82" roughness={0.3} />
            </mesh>
          ))}
          {/* Drapeau */}
          <mesh position={[0, 3.2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.1, 8]} />
            <meshStandardMaterial color="#888" />
          </mesh>
          {["#0055a4", "#ffffff", "#ef4135"].map((color, i) => (
            <mesh key={color} position={[0.12 + i * 0.16, 3.55, 0]}>
              <boxGeometry args={[0.16, 0.32, 0.01]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </group>
        <group position={[0, 0, 1.2]}>
          <Figurine spec={player} pose={won ? "wave" : "slump"} still={still} />
        </group>
      </group>
    </StageCanvas>
  );
}

// ——— Accueil : la ligne de départ ———

export function HomeScene({ cast, label }: { cast: FigurineSpec[]; label: string }) {
  const still = usePrefersReducedMotion();
  const positions: RegionId[] = [
    "north",
    "ile_de_france",
    "east",
    "west",
    "central",
    "south_west",
    "south_east",
    "central",
    "west",
  ];
  return (
    <StageCanvas
      label={label}
      className="h-full w-full"
      camera={{ position: [0, 6.6, 8.4], fov: 34 }}
      shadowY={0.11}
      shadowScale={14}
    >
      <Drift still={still} amplitude={0.35}>
        <group position={[0.3, -0.9, 0]}>
          <FranceDiorama />
          {cast.slice(0, 9).map((spec, i) => {
            const [x, y, z] = regionTop(positions[i]!);
            const offset = i >= 7 ? 0.45 : 0;
            return (
              <group key={spec.id} position={[x + offset, y, z + offset * 0.4]} scale={0.34}>
                <Figurine
                  spec={spec}
                  pose={i % 3 === 0 ? "wave" : i % 3 === 1 ? "speak" : "idle"}
                  phase={i * 0.9}
                  still={still}
                />
              </group>
            );
          })}
        </group>
      </Drift>
    </StageCanvas>
  );
}
