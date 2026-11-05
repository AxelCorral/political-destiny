/**
 * Fiches paramétriques des figurines « vinyl toy » à grosse tête.
 *
 * Choix éditorial : caricature douce et reconnaissable (coiffure, couleurs, lunettes,
 * silhouette, accessoire signature), jamais réaliste, jamais moqueuse sur le physique
 * ou la santé. Aucune ressemblance photographique : tout est construit en primitives.
 */

export type HairStyle =
  | "bald"
  | "buzz"
  | "receding"
  | "sidePart"
  | "slick"
  | "swept"
  | "tousled"
  | "curly"
  | "bob"
  | "shoulder"
  | "layeredBlonde"
  | "silverMane";

export type GlassesStyle = "none" | "round" | "rect" | "thin";
export type FacialHair = "none" | "stubble" | "shortBeard" | "fullBeard";
export type Outfit = "suitTie" | "suitOpen" | "maoJacket" | "blazer" | "sweater" | "jacketColor";
export type Accessory = "none" | "rosette" | "scarf" | "pocketSquare" | "pin";

export interface FigurineSpec {
  id: string;
  label: string;
  /** Couleur de peau (vinyl, légèrement saturée). */
  skin: string;
  hair: { style: HairStyle; color: string };
  /** 0.9 = tête plus étroite, 1.1 = tête plus large. */
  headWidth: number;
  /** 0.9 = plus petit, 1.1 = plus grand. */
  height: number;
  /** Corpulence 0.9–1.15. */
  build: number;
  glasses: GlassesStyle;
  facialHair: FacialHair;
  facialHairColor?: string;
  brows: "flat" | "arched" | "heavy";
  outfit: Outfit;
  suitColor: string;
  shirtColor: string;
  tieColor?: string;
  accessory: Accessory;
  accessoryColor?: string;
  /** Couleur d'accent (socle, halo) = couleur du parti. */
  accent: string;
}

const SKIN_LIGHT = "#f2c7a5";
const SKIN_WARM = "#e8b48d";
const SKIN_TAN = "#d9a079";

export const figurineSpecs: Record<string, FigurineSpec> = {
  le_pen: {
    id: "le_pen",
    label: "Marine Le Pen",
    skin: SKIN_LIGHT,
    hair: { style: "layeredBlonde", color: "#e6c36a" },
    headWidth: 1.08,
    height: 1.0,
    build: 1.05,
    glasses: "none",
    facialHair: "none",
    brows: "flat",
    outfit: "blazer",
    suitColor: "#1d2c57",
    shirtColor: "#f4f1ea",
    accessory: "pin",
    accessoryColor: "#2a4bb0",
    accent: "#0d3b8f",
  },
  bardella: {
    id: "bardella",
    label: "Jordan Bardella",
    skin: SKIN_WARM,
    hair: { style: "slick", color: "#2a1d16" },
    headWidth: 0.95,
    height: 1.06,
    build: 0.95,
    glasses: "none",
    facialHair: "none",
    brows: "flat",
    outfit: "suitTie",
    suitColor: "#18223f",
    shirtColor: "#ffffff",
    tieColor: "#1b2a55",
    accessory: "none",
    accent: "#0d3b8f",
  },
  melenchon: {
    id: "melenchon",
    label: "Jean-Luc Mélenchon",
    skin: SKIN_WARM,
    hair: { style: "swept", color: "#d9d6d0" },
    headWidth: 1.06,
    height: 0.98,
    build: 1.08,
    glasses: "none",
    facialHair: "none",
    brows: "heavy",
    outfit: "maoJacket",
    suitColor: "#26242a",
    shirtColor: "#26242a",
    accessory: "pin",
    accessoryColor: "#c8102e",
    accent: "#6b315d",
  },
  glucksmann: {
    id: "glucksmann",
    label: "Raphaël Glucksmann",
    skin: SKIN_LIGHT,
    hair: { style: "tousled", color: "#4a3426" },
    headWidth: 0.96,
    height: 1.08,
    build: 0.96,
    glasses: "none",
    facialHair: "stubble",
    facialHairColor: "#5b4535",
    brows: "flat",
    outfit: "suitOpen",
    suitColor: "#2b2f3a",
    shirtColor: "#ffffff",
    accessory: "none",
    accent: "#e4007c",
  },
  tondelier: {
    id: "tondelier",
    label: "Marine Tondelier",
    skin: SKIN_LIGHT,
    hair: { style: "shoulder", color: "#7a4a2e" },
    headWidth: 1.0,
    height: 0.98,
    build: 1.0,
    glasses: "none",
    facialHair: "none",
    brows: "arched",
    outfit: "jacketColor",
    suitColor: "#2f9e44",
    shirtColor: "#f6f3e9",
    accessory: "none",
    accent: "#00a85a",
  },
  attal: {
    id: "attal",
    label: "Gabriel Attal",
    skin: SKIN_WARM,
    hair: { style: "sidePart", color: "#231915" },
    headWidth: 0.96,
    height: 1.0,
    build: 0.94,
    glasses: "none",
    facialHair: "none",
    brows: "arched",
    outfit: "suitTie",
    suitColor: "#1b2340",
    shirtColor: "#ffffff",
    tieColor: "#22305c",
    accessory: "none",
    accent: "#ffcc00",
  },
  philippe: {
    id: "philippe",
    label: "Édouard Philippe",
    skin: SKIN_LIGHT,
    hair: { style: "buzz", color: "#e7e5e1" },
    headWidth: 0.98,
    height: 1.12,
    build: 1.0,
    glasses: "thin",
    facialHair: "fullBeard",
    facialHairColor: "#ecebe8",
    brows: "flat",
    outfit: "suitTie",
    suitColor: "#24324f",
    shirtColor: "#dfe8f5",
    tieColor: "#2b4b8c",
    accessory: "none",
    accent: "#1fa3d6",
  },
  retailleau: {
    id: "retailleau",
    label: "Bruno Retailleau",
    skin: SKIN_LIGHT,
    hair: { style: "sidePart", color: "#9b9893" },
    headWidth: 1.0,
    height: 1.0,
    build: 1.0,
    glasses: "rect",
    facialHair: "none",
    brows: "heavy",
    outfit: "suitTie",
    suitColor: "#1f2430",
    shirtColor: "#f3f5f8",
    tieColor: "#13306b",
    accessory: "rosette",
    accessoryColor: "#c8102e",
    accent: "#0066cc",
  },
  zemmour: {
    id: "zemmour",
    label: "Éric Zemmour",
    skin: SKIN_WARM,
    hair: { style: "receding", color: "#2b2420" },
    headWidth: 0.92,
    height: 0.94,
    build: 0.9,
    glasses: "none",
    facialHair: "none",
    brows: "heavy",
    outfit: "suitTie",
    suitColor: "#1c1d22",
    shirtColor: "#ffffff",
    tieColor: "#1c1d22",
    accessory: "none",
    accent: "#1a1a6e",
  },
  lisnard: {
    id: "lisnard",
    label: "David Lisnard",
    skin: SKIN_TAN,
    hair: { style: "buzz", color: "#8e8a84" },
    headWidth: 1.02,
    height: 1.0,
    build: 1.02,
    glasses: "none",
    facialHair: "none",
    brows: "flat",
    outfit: "suitOpen",
    suitColor: "#23395d",
    shirtColor: "#eaf2fb",
    accessory: "pocketSquare",
    accessoryColor: "#ffffff",
    accent: "#e85d04",
  },
  // ——— Candidatures secondaires et remplaçants possibles ———
  roussel: {
    id: "roussel",
    label: "Fabien Roussel",
    skin: SKIN_LIGHT,
    hair: { style: "buzz", color: "#3a2c24" },
    headWidth: 1.06,
    height: 1.0,
    build: 1.08,
    glasses: "none",
    facialHair: "shortBeard",
    facialHairColor: "#4a3a30",
    brows: "flat",
    outfit: "suitOpen",
    suitColor: "#2a2e38",
    shirtColor: "#ffffff",
    accessory: "pin",
    accessoryColor: "#dd0000",
    accent: "#dd0000",
  },
  ruffin: {
    id: "ruffin",
    label: "François Ruffin",
    skin: SKIN_LIGHT,
    hair: { style: "curly", color: "#4a3324" },
    headWidth: 1.0,
    height: 1.02,
    build: 0.98,
    glasses: "none",
    facialHair: "none",
    facialHairColor: "#4a3324",
    brows: "heavy",
    outfit: "sweater",
    suitColor: "#7a8a6a",
    shirtColor: "#d8dccd",
    accessory: "none",
    accent: "#c2185b",
  },
  villepin: {
    id: "villepin",
    label: "Dominique de Villepin",
    skin: SKIN_TAN,
    hair: { style: "silverMane", color: "#e5e3df" },
    headWidth: 0.98,
    height: 1.14,
    build: 0.98,
    glasses: "none",
    facialHair: "none",
    brows: "heavy",
    outfit: "suitTie",
    suitColor: "#262a35",
    shirtColor: "#ffffff",
    tieColor: "#6d1a36",
    accessory: "pocketSquare",
    accessoryColor: "#ffffff",
    accent: "#7b5ea7",
  },
  cazeneuve: {
    id: "cazeneuve",
    label: "Bernard Cazeneuve",
    skin: SKIN_LIGHT,
    hair: { style: "bald", color: "#b9b4ad" },
    headWidth: 1.0,
    height: 0.98,
    build: 1.0,
    glasses: "round",
    facialHair: "none",
    brows: "flat",
    outfit: "suitTie",
    suitColor: "#27303f",
    shirtColor: "#f2f4f8",
    tieColor: "#5a1f2a",
    accessory: "none",
    accent: "#d6336c",
  },
  faure: {
    id: "faure",
    label: "Olivier Faure",
    skin: SKIN_LIGHT,
    hair: { style: "bald", color: "#6b625a" },
    headWidth: 1.0,
    height: 1.02,
    build: 1.0,
    glasses: "rect",
    facialHair: "stubble",
    facialHairColor: "#6b625a",
    brows: "flat",
    outfit: "suitOpen",
    suitColor: "#2c3140",
    shirtColor: "#ffffff",
    accessory: "none",
    accent: "#e4007c",
  },
  royal: {
    id: "royal",
    label: "Ségolène Royal",
    skin: SKIN_LIGHT,
    hair: { style: "bob", color: "#3b2a22" },
    headWidth: 0.98,
    height: 0.98,
    build: 0.98,
    glasses: "none",
    facialHair: "none",
    brows: "arched",
    outfit: "jacketColor",
    suitColor: "#f4f1ea",
    shirtColor: "#f4f1ea",
    accessory: "none",
    accent: "#e4007c",
  },
  bertrand: {
    id: "bertrand",
    label: "Xavier Bertrand",
    skin: SKIN_LIGHT,
    hair: { style: "receding", color: "#7d766e" },
    headWidth: 1.08,
    height: 1.0,
    build: 1.1,
    glasses: "none",
    facialHair: "none",
    brows: "flat",
    outfit: "suitTie",
    suitColor: "#1f2a44",
    shirtColor: "#ffffff",
    tieColor: "#2a64c5",
    accessory: "none",
    accent: "#0066cc",
  },
  dupont_aignan: {
    id: "dupont_aignan",
    label: "Nicolas Dupont-Aignan",
    skin: SKIN_LIGHT,
    hair: { style: "sidePart", color: "#8c867e" },
    headWidth: 0.96,
    height: 1.04,
    build: 0.95,
    glasses: "rect",
    facialHair: "none",
    brows: "flat",
    outfit: "suitTie",
    suitColor: "#232a3b",
    shirtColor: "#ffffff",
    tieColor: "#0055a4",
    accessory: "rosette",
    accessoryColor: "#0055a4",
    accent: "#2c4a8a",
  },
  arthaud: {
    id: "arthaud",
    label: "Nathalie Arthaud",
    skin: SKIN_LIGHT,
    hair: { style: "bob", color: "#4b3326" },
    headWidth: 0.96,
    height: 0.96,
    build: 0.96,
    glasses: "none",
    facialHair: "none",
    brows: "flat",
    outfit: "sweater",
    suitColor: "#b3202a",
    shirtColor: "#f2efe8",
    accessory: "none",
    accent: "#b3202a",
  },
};

/** Figurine neutre pour le joueur d'un mouvement personnalisé. */
export function customFigurineSpec(accent: string, label: string): FigurineSpec {
  return {
    id: "custom",
    label,
    skin: SKIN_WARM,
    hair: { style: "sidePart", color: "#3b2a22" },
    headWidth: 1,
    height: 1,
    build: 1,
    glasses: "none",
    facialHair: "none",
    brows: "flat",
    outfit: "suitOpen",
    suitColor: "#2b3040",
    shirtColor: "#ffffff",
    accessory: "pin",
    accessoryColor: accent,
    accent,
  };
}

export type FigurinePose = "idle" | "speak" | "cheer" | "slump" | "wave" | "handshake";
