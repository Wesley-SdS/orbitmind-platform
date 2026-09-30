import type { OfficeAgentStatus } from "@/lib/office/types";

/** Escurece (k < 1) ou clareia (k > 1) uma cor 0xRRGGBB. */
export function shade(color: number, k: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const f = (v: number): number => {
    const out = k <= 1 ? v * k : v + (255 - v) * (k - 1);
    return Math.max(0, Math.min(255, Math.round(out)));
  };
  return (f(r) << 16) | (f(g) << 8) | f(b);
}

export const PALETTE = {
  paper: 0xf3f1ec,
  graphite: 0x1a1a17,
  accent: 0xf2541b,
  wall: 0x625b52,
  wallTopCap: 0x7f776c,
  glassCap: 0xe2ddd2,
  doorFrame: 0xc99a66,
  slab: 0xc9c2b4,
  slabTop: 0xb5ac9e,
  concrete: 0xb5ac9e,
  concreteLine: 0xa49a8a,
  grass: 0x9db56f,
  grassDark: 0x8aa55f,
  grassLight: 0xaac47a,
  wood: 0xb07a45,
  woodTop: 0xc48d57,
  woodDark: 0x8a5a30,
  dark: 0x3a3733,
  darker: 0x2a2825,
  darkest: 0x141413,
  chair: 0x2f2c28,
  keyboard: 0xe8e0d0,
  mug: 0xf2541b,
  plantPot: 0xb5623a,
  plantPotTop: 0x5a3b21,
  leaf1: 0x4d8c3f,
  leaf2: 0x3f7f3a,
  leaf3: 0x6fae52,
  leafHi: 0xa3d47f,
  shelf: 0x6e4a2a,
  shelfPlank: 0xa27a52,
  sofa: 0xc9583a,
  rugLobby: 0xa45c4f,
  rugLobbyLine: 0x7f4238,
  rugCreative: 0x6a5a8a,
  rugCreativeLine: 0x4d4068,
  rugReview: 0x8fb3a0,
  rugReviewLine: 0x6f9482,
  rugStrategy: 0x5f8f9c,
  rugStrategyLine: 0x4a7681,
  whiteboard: 0xfbfaf7,
  whiteboardFrame: 0x8f8c84,
  window1: 0xeaf6ff,
  window2: 0xa9d3f2,
  window3: 0x7fb6e3,
  windowFrame: 0xf4f2ec,
  glass: 0xbfe0f6,
  glassFrame: 0xffffff,
  cabinet: 0xe6e1d7,
  cabinetLine: 0xbdb7ab,
  printer: 0xd9d4ca,
  printerDark: 0xbdb7ab,
  box: 0xc9a06c,
  boxLight: 0xd8b27e,
  lampShade: 0xf2d9a0,
  lampShadeTop: 0xf7e7c0,
  lampLight: 0xffd28a,
  waterBottle: 0x8fc6ea,
  waterBottleTop: 0xbfe0f6,
  cooler: 0xe8e4dc,
  screenDark: 0x1a1a17,
  screenFrame: 0x3a3733,
  paperWhite: 0xfbfaf7,
  ink: 0x1a1a17,
  ghost: 0xf4f2ec,
} as const;

export const STATUS_COLORS: Record<OfficeAgentStatus, number> = {
  idle: 0x8f8c84,
  working: 0x2f6fd6,
  done: 0x2e8b57,
  checkpoint: 0xf2541b,
  delivering: 0x8b5cf6,
};

export const SPINE_COLORS = [0xe0457b, 0x2f6fd6, 0xd98e04, 0x2e8b57, 0x7c5cff, 0xf2541b, 0x14a3a3, 0x1a1a17];

export const FLOOR_COLORS = {
  wood: { base: 0xd9bd8f, a: 0xcfb283, b: 0xe0c69a, line: 0xb89a6a },
  carpet: { base: 0xb9a6cc, dotLight: 0xcbbbd9, dotDark: 0xad99c1 },
  tile: { base: 0xe4dac6, line: 0xc9bda3, inner: 0xede5d3 },
  darkwood: { base: 0xa97d55, a: 0x9c7049, b: 0xb3865c, line: 0x7d5636 },
  parquet: { base: 0xd1a86f, alt: 0xc69a63, line: 0xb58a55 },
  stone: { base: 0xcbc5b9, a: 0xc4bdb0, b: 0xc8c1b4, line: 0xb1aa9c },
} as const;
