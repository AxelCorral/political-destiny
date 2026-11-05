"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { MathUtils } from "three";

import type { FigurinePose, FigurineSpec, HairStyle } from "./specs";

const VINYL = { roughness: 0.38, metalness: 0 } as const;
const PI = Math.PI;

interface FigurineProps {
  spec: FigurineSpec;
  pose?: FigurinePose;
  /** Décale les animations pour éviter que toutes les figurines bougent à l'unisson. */
  phase?: number;
  /** Désactive toute animation (préférence « réduire les animations »). */
  still?: boolean;
  showBase?: boolean;
}

interface PoseTarget {
  leftArm: [number, number];
  rightArm: [number, number];
  headPitch: number;
  bodyDrop: number;
}

const POSES: Record<FigurinePose, PoseTarget> = {
  idle: { leftArm: [0, 0.12], rightArm: [0, -0.12], headPitch: 0, bodyDrop: 0 },
  speak: { leftArm: [0, 0.15], rightArm: [-1.1, -0.35], headPitch: -0.05, bodyDrop: 0 },
  cheer: { leftArm: [0, 2.6], rightArm: [0, -2.6], headPitch: -0.18, bodyDrop: -0.04 },
  slump: { leftArm: [0.2, 0.05], rightArm: [0.2, -0.05], headPitch: 0.4, bodyDrop: 0.08 },
  wave: { leftArm: [0, 0.12], rightArm: [0, -2.5], headPitch: -0.06, bodyDrop: 0 },
  handshake: { leftArm: [0, 0.12], rightArm: [-1.35, -0.05], headPitch: 0, bodyDrop: 0 },
};

function Mat({ color }: { color: string }) {
  return <meshStandardMaterial color={color} {...VINYL} />;
}

/** Calotte de cheveux : portion haute d'une sphère légèrement plus grande que le crâne. */
function Cap({
  color,
  r,
  theta = PI * 0.42,
  tilt = 0,
  scale = [1, 1, 1],
  y = 0,
}: {
  color: string;
  r: number;
  theta?: number;
  tilt?: number;
  scale?: [number, number, number];
  y?: number;
}) {
  return (
    <mesh rotation={[-tilt, 0, 0]} scale={scale} position={[0, y, 0]} castShadow>
      <sphereGeometry args={[r, 32, 20, 0, PI * 2, 0, theta]} />
      <Mat color={color} />
    </mesh>
  );
}

function Hair({ style, color, r }: { style: HairStyle; color: string; r: number }) {
  const R = r * 1.04;
  switch (style) {
    case "bald":
      // Couronne latérale et arrière uniquement.
      return (
        <mesh rotation={[-0.2, 0, 0]} castShadow>
          <sphereGeometry args={[R, 32, 16, PI * 0.85, PI * 1.3, PI * 0.36, PI * 0.22]} />
          <Mat color={color} />
        </mesh>
      );
    case "buzz":
      return <Cap color={color} r={R * 0.99} theta={PI * 0.4} tilt={0.18} />;
    case "receding":
      return (
        <group>
          <Cap color={color} r={R} theta={PI * 0.36} tilt={0.55} />
          <mesh rotation={[-0.2, 0, 0]}>
            <sphereGeometry args={[R, 32, 16, PI * 0.8, PI * 1.4, PI * 0.3, PI * 0.26]} />
            <Mat color={color} />
          </mesh>
        </group>
      );
    case "sidePart":
      return (
        <group>
          <Cap color={color} r={R} theta={PI * 0.42} tilt={0.12} />
          <mesh position={[r * 0.28, r * 0.72, r * 0.42]} rotation={[0.5, 0, -0.5]} castShadow>
            <capsuleGeometry args={[r * 0.17, r * 0.5, 6, 12]} />
            <Mat color={color} />
          </mesh>
        </group>
      );
    case "slick":
      return (
        <group>
          <Cap color={color} r={R} theta={PI * 0.4} tilt={0.1} />
          <mesh position={[0, r * 0.86, r * 0.35]} rotation={[0.9, 0, 0]} castShadow>
            <capsuleGeometry args={[r * 0.2, r * 0.55, 6, 12]} />
            <Mat color={color} />
          </mesh>
        </group>
      );
    case "swept":
      return (
        <group>
          <Cap color={color} r={R} theta={PI * 0.44} tilt={0.35} scale={[1.02, 1.08, 1.06]} />
          <mesh position={[0, r * 0.5, -r * 0.55]} castShadow>
            <sphereGeometry args={[r * 0.62, 24, 16]} />
            <Mat color={color} />
          </mesh>
        </group>
      );
    case "tousled":
      return (
        <group>
          <Cap color={color} r={R} theta={PI * 0.45} tilt={0.3} />
          {[
            [0.25, 0.9, 0.3],
            [-0.2, 0.92, 0.32],
            [0.0, 0.98, 0.05],
            [0.4, 0.7, 0.45],
            [-0.38, 0.75, 0.38],
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x! * r, y! * r, z! * r]} castShadow>
              <sphereGeometry args={[r * 0.26, 14, 10]} />
              <Mat color={color} />
            </mesh>
          ))}
        </group>
      );
    case "curly":
      return (
        <group>
          <Cap color={color} r={R} theta={PI * 0.46} tilt={0.3} />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * PI * 2;
            const ring = i % 2 === 0 ? 0.82 : 0.95;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * r * 0.55, r * ring, Math.sin(a) * r * 0.55]}
                castShadow
              >
                <sphereGeometry args={[r * 0.24, 12, 10]} />
                <Mat color={color} />
              </mesh>
            );
          })}
        </group>
      );
    case "bob":
    case "shoulder":
    case "layeredBlonde": {
      const length = style === "bob" ? 1.0 : style === "shoulder" ? 1.3 : 1.12;
      return (
        <group>
          <Cap color={color} r={R * 1.02} theta={PI * 0.52} tilt={0.38} />
          {/* Coque arrière et latérale ouverte sur le visage, qui descend vers la mâchoire ou les épaules. */}
          <mesh
            scale={[1.06, length, 1.04]}
            position={[0, -r * (length - 1) * 0.55, -r * 0.04]}
            castShadow
          >
            <sphereGeometry args={[R, 32, 20, PI * 0.82, PI * 1.36, 0, PI * 0.74]} />
            <meshStandardMaterial color={color} {...VINYL} side={2} />
          </mesh>
          {style === "layeredBlonde" && (
            <mesh position={[-r * 0.25, r * 0.62, r * 0.62]} rotation={[0.6, 0.2, 0.9]} castShadow>
              <capsuleGeometry args={[r * 0.17, r * 0.55, 6, 12]} />
              <Mat color={color} />
            </mesh>
          )}
        </group>
      );
    }
    case "silverMane":
      return (
        <group>
          <Cap color={color} r={R * 1.04} theta={PI * 0.5} tilt={0.42} scale={[1.05, 1.12, 1.1]} />
          <mesh position={[0, r * 0.15, -r * 0.62]} castShadow>
            <sphereGeometry args={[r * 0.72, 24, 16]} />
            <Mat color={color} />
          </mesh>
        </group>
      );
  }
}

function Face({ spec, r }: { spec: FigurineSpec; r: number }) {
  const z = r * 0.9;
  const eyeY = r * 0.05;
  const browColor = spec.hair.style === "bald" ? "#6b625a" : spec.hair.color;
  const browTilt = spec.brows === "arched" ? 0.22 : spec.brows === "heavy" ? -0.12 : 0;
  const browThick = spec.brows === "heavy" ? 0.06 : 0.04;
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Œil vinyl : pastille sombre + reflet. */}
          <mesh position={[side * r * 0.33, eyeY, z]} scale={[1, 1.25, 0.6]}>
            <sphereGeometry args={[r * 0.085, 16, 12]} />
            <meshStandardMaterial color="#1c1a1f" roughness={0.2} />
          </mesh>
          <mesh position={[side * r * 0.33 + r * 0.03, eyeY + r * 0.04, z + r * 0.05]}>
            <sphereGeometry args={[r * 0.025, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh
            position={[side * r * 0.33, eyeY + r * 0.2, z - r * 0.02]}
            rotation={[0, 0, side * browTilt]}
          >
            <boxGeometry args={[r * 0.24, r * browThick, r * 0.05]} />
            <Mat color={browColor} />
          </mesh>
          {/* Oreilles */}
          <mesh position={[side * r * 0.98, 0, 0]} scale={[0.5, 1, 0.8]}>
            <sphereGeometry args={[r * 0.18, 12, 10]} />
            <Mat color={spec.skin} />
          </mesh>
        </group>
      ))}
      {/* Nez */}
      <mesh position={[0, -r * 0.1, r * 0.98]} scale={[1, 1.1, 1]}>
        <sphereGeometry args={[r * 0.09, 14, 10]} />
        <Mat color={spec.skin} />
      </mesh>
      {/* Bouche : arc de sourire */}
      <mesh position={[0, -r * 0.33, r * 0.86]} rotation={[0.15, 0, PI]}>
        <torusGeometry args={[r * 0.14, r * 0.025, 8, 16, PI * 0.8]} />
        <meshStandardMaterial color="#7a3b35" roughness={0.5} />
      </mesh>
      {spec.glasses !== "none" && <Glasses style={spec.glasses} r={r} />}
      {spec.facialHair !== "none" && (
        <mesh rotation={[-0.15, 0, 0]} castShadow>
          <sphereGeometry
            args={[
              r * (spec.facialHair === "fullBeard" ? 1.06 : 1.015),
              32,
              16,
              PI * 0.05,
              PI * 0.9,
              PI *
                (spec.facialHair === "stubble"
                  ? 0.6
                  : spec.facialHair === "shortBeard"
                    ? 0.64
                    : 0.56),
              PI * 0.3,
            ]}
          />
          <meshStandardMaterial
            color={spec.facialHairColor ?? spec.hair.color}
            {...VINYL}
            transparent={spec.facialHair === "stubble"}
            opacity={spec.facialHair === "stubble" ? 0.28 : 1}
          />
        </mesh>
      )}
    </group>
  );
}

function Glasses({ style, r }: { style: "round" | "rect" | "thin"; r: number }) {
  const z = r * 0.97;
  const y = r * 0.05;
  const frame = style === "thin" ? "#b8b2a8" : "#202024";
  const thickness = style === "thin" ? 0.012 : 0.022;
  return (
    <group>
      {[-1, 1].map((side) =>
        style === "rect" ? (
          <group key={side} position={[side * r * 0.33, y, z]} scale={[1.2, 0.85, 1]}>
            <mesh rotation={[0, 0, PI / 4]}>
              <torusGeometry args={[r * 0.15, r * thickness, 6, 4]} />
              <meshStandardMaterial color={frame} roughness={0.3} />
            </mesh>
          </group>
        ) : (
          <mesh key={side} position={[side * r * 0.33, y, z]}>
            <torusGeometry args={[r * 0.15, r * thickness, 8, 24]} />
            <meshStandardMaterial color={frame} roughness={0.3} />
          </mesh>
        ),
      )}
      <mesh position={[0, y + r * 0.03, z + r * 0.02]}>
        <boxGeometry args={[r * 0.2, r * thickness * 1.6, r * 0.02]} />
        <meshStandardMaterial color={frame} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Torso({ spec }: { spec: FigurineSpec }) {
  const w = 0.42 * spec.build;
  const open =
    spec.outfit === "suitTie" ||
    spec.outfit === "suitOpen" ||
    spec.outfit === "blazer" ||
    spec.outfit === "jacketColor";
  return (
    <group>
      <mesh position={[0, 0.72, 0]} scale={[1, 1, 0.78]} castShadow>
        <capsuleGeometry args={[w, 0.42, 8, 20]} />
        <Mat color={spec.suitColor} />
      </mesh>
      {open && (
        // Plastron de chemise en V.
        <mesh position={[0, 0.92, w * 0.72]} rotation={[0.12, 0, PI]}>
          <coneGeometry args={[0.14, 0.42, 3, 1]} />
          <Mat color={spec.shirtColor} />
        </mesh>
      )}
      {spec.outfit === "suitTie" && spec.tieColor && (
        <mesh position={[0, 0.86, w * 0.79]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.07, 0.3, 0.03]} />
          <Mat color={spec.tieColor} />
        </mesh>
      )}
      {(spec.outfit === "maoJacket" || spec.outfit === "sweater") && (
        <mesh position={[0, 1.09, 0]} rotation={[PI / 2, 0, 0]}>
          <torusGeometry args={[0.17, 0.045, 10, 24]} />
          <Mat color={spec.outfit === "sweater" ? spec.shirtColor : spec.suitColor} />
        </mesh>
      )}
      {spec.accessory !== "none" && spec.accessoryColor && (
        <mesh position={[-w * 0.55, 0.95, w * 0.66]} rotation={[PI / 2 - 0.3, 0, 0]}>
          {spec.accessory === "pocketSquare" ? (
            <boxGeometry args={[0.1, 0.02, 0.06]} />
          ) : (
            <cylinderGeometry
              args={[
                spec.accessory === "rosette" ? 0.055 : 0.035,
                spec.accessory === "rosette" ? 0.055 : 0.035,
                0.02,
                16,
              ]}
            />
          )}
          <Mat color={spec.accessoryColor} />
        </mesh>
      )}
    </group>
  );
}

export function Figurine({
  spec,
  pose = "idle",
  phase = 0,
  still = false,
  showBase = true,
}: FigurineProps) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const r = 0.55 * spec.headWidth;
  const target = POSES[pose];
  const armColor = spec.suitColor;
  const handColor = spec.skin;

  const initial = useMemo(() => target, [target]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime + phase;
    const k = still ? 1 : 1 - Math.exp(-delta * 8);
    const breath = still ? 0 : Math.sin(t * 2.1) * 0.012;
    if (body.current) {
      body.current.position.y = MathUtils.lerp(body.current.position.y, -target.bodyDrop, k);
      body.current.scale.y = 1 + breath;
      body.current.rotation.z = still ? 0 : Math.sin(t * 0.9) * 0.03;
    }
    if (head.current) {
      const nod = still ? 0 : pose === "speak" ? Math.sin(t * 6) * 0.05 : Math.sin(t * 1.3) * 0.025;
      head.current.rotation.x = MathUtils.lerp(head.current.rotation.x, target.headPitch + nod, k);
      head.current.rotation.y = still ? 0 : Math.sin(t * 0.7) * 0.12;
    }
    const wiggle = still
      ? 0
      : pose === "wave"
        ? Math.sin(t * 9) * 0.35
        : pose === "speak"
          ? Math.sin(t * 4) * 0.25
          : pose === "cheer"
            ? Math.sin(t * 7) * 0.12
            : 0;
    if (leftArm.current) {
      leftArm.current.rotation.x = MathUtils.lerp(leftArm.current.rotation.x, target.leftArm[0], k);
      leftArm.current.rotation.z = MathUtils.lerp(
        leftArm.current.rotation.z,
        target.leftArm[1] + (pose === "cheer" ? wiggle : 0),
        k,
      );
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = MathUtils.lerp(
        rightArm.current.rotation.x,
        target.rightArm[0] + (pose === "speak" ? wiggle * 0.5 : 0),
        k,
      );
      rightArm.current.rotation.z = MathUtils.lerp(
        rightArm.current.rotation.z,
        target.rightArm[1] + (pose === "wave" ? wiggle : pose === "cheer" ? -wiggle : 0),
        k,
      );
    }
    if (root.current && !still && pose === "cheer") {
      root.current.position.y = Math.abs(Math.sin(t * 5)) * 0.06;
    } else if (root.current) {
      root.current.position.y = MathUtils.lerp(root.current.position.y, 0, k);
    }
  });

  const shoulderX = 0.42 * spec.build + 0.06;

  return (
    <group scale={spec.height}>
      {showBase && (
        <group>
          <mesh position={[0, -0.04, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[0.62, 0.68, 0.08, 40]} />
            <meshStandardMaterial color={spec.accent} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.005, 0]} receiveShadow>
            <cylinderGeometry args={[0.56, 0.56, 0.01, 40]} />
            <meshStandardMaterial color="#f6f2ea" roughness={0.6} />
          </mesh>
        </group>
      )}
      <group ref={root}>
        {/* Jambes et chaussures */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.15, 0.2, 0]} castShadow>
              <capsuleGeometry args={[0.12, 0.2, 6, 12]} />
              <Mat color={spec.outfit === "sweater" ? "#3a3f4a" : spec.suitColor} />
            </mesh>
            <mesh position={[side * 0.15, 0.06, 0.05]} scale={[1, 0.6, 1.4]} castShadow>
              <sphereGeometry args={[0.12, 14, 10]} />
              <Mat color="#1c1b1f" />
            </mesh>
          </group>
        ))}
        <group ref={body} position={[0, -initial.bodyDrop, 0]}>
          <Torso spec={spec} />
          {/* Bras : pivot à l'épaule */}
          {[
            { side: -1, ref: leftArm, rot: initial.leftArm },
            { side: 1, ref: rightArm, rot: initial.rightArm },
          ].map(({ side, ref, rot }) => (
            <group
              key={side}
              ref={ref}
              position={[side * shoulderX, 1.0, 0]}
              rotation={[rot[0], 0, rot[1]]}
            >
              <mesh position={[0, -0.25, 0]} castShadow>
                <capsuleGeometry args={[0.095, 0.32, 6, 12]} />
                <Mat color={armColor} />
              </mesh>
              <mesh position={[0, -0.5, 0]} castShadow>
                <sphereGeometry args={[0.1, 14, 10]} />
                <Mat color={handColor} />
              </mesh>
            </group>
          ))}
          {/* Cou + tête */}
          <mesh position={[0, 1.12, 0]}>
            <cylinderGeometry args={[0.11, 0.13, 0.12, 16]} />
            <Mat color={spec.skin} />
          </mesh>
          <group ref={head} position={[0, 1.12 + r * 0.92, 0]}>
            <mesh scale={[1, 0.97, 0.94]} castShadow>
              <sphereGeometry args={[r, 40, 32]} />
              <Mat color={spec.skin} />
            </mesh>
            <Face spec={spec} r={r} />
            <Hair style={spec.hair.style} color={spec.hair.color} r={r} />
          </group>
        </group>
      </group>
    </group>
  );
}
