import type { AvatarLook, OfficeRoom, OfficeSeat } from "./types";

/**
 * Planta do escritório virtual — grid de 30 × 16 tiles, projeção isométrica.
 *
 * Linha 1 (y 1..7):  Pesquisa (8) · Estúdio Criativo (10) · Revisão (6)
 * Linha 2 (y 9..15): Estratégia (8) · Publicação (6) · Lobby (10)
 * Corredores de 2 tiles entre as salas. Paredes externas em x = 0.7..1 e y = 0.7..1.
 */

export const BUILDING_W = 30;
export const BUILDING_D = 16;

export const WALL_HEIGHT = 1.25;
export const EXTERIOR_WALL_HEIGHT = 2.3;
export const GLASS_HEIGHT = 1.05;
export const WALL_THICKNESS = 0.18;
export const EXTERIOR_WALL_THICKNESS = 0.3;

export const OFFICE_ROOMS: OfficeRoom[] = [
  { id: "research", name: "Laboratório de Pesquisa", accent: "#2f6fd6", x: 1, y: 1, w: 8, h: 6, floor: "wood", doors: { e: [3, 4], s: [3, 4] } },
  { id: "creative", name: "Estúdio Criativo", accent: "#8b5cf6", x: 11, y: 1, w: 10, h: 6, floor: "carpet", doors: { w: [3, 4], s: [4, 5] } },
  { id: "review", name: "Sala de Revisão", accent: "#2e8b57", x: 23, y: 1, w: 6, h: 6, floor: "tile", doors: { w: [3, 4] } },
  { id: "strategy", name: "Sala de Estratégia", accent: "#0b8fa8", x: 1, y: 9, w: 8, h: 6, floor: "darkwood", doors: { e: [3, 4], n: [3, 4] } },
  { id: "publishing", name: "Publicação", accent: "#d98e04", x: 11, y: 9, w: 6, h: 6, floor: "parquet", doors: { w: [3, 4], e: [3, 4] } },
  { id: "lobby", name: "Lobby · Café", accent: "#66645d", x: 19, y: 9, w: 10, h: 6, floor: "stone", doors: { w: [3, 4], n: [5, 6] } },
];

export interface DeskSpec {
  roomId: string;
  x: number;
  y: number;
}

/** Mesas (canto superior esquerdo do tampo, 1,6 × 0,8 tiles). A cadeira fica ao norte. */
export const DESKS: DeskSpec[] = [
  { roomId: "research", x: 2.2, y: 3.6 },
  { roomId: "research", x: 5.4, y: 3.6 },
  { roomId: "creative", x: 12.2, y: 3.6 },
  { roomId: "creative", x: 15.2, y: 3.6 },
  { roomId: "creative", x: 18.2, y: 3.6 },
  { roomId: "review", x: 25.2, y: 3.8 },
  { roomId: "strategy", x: 2.2, y: 12.0 },
  { roomId: "publishing", x: 12.6, y: 11.8 },
];

/** Posição do agente sentado numa mesa: centro da cadeira. */
export function deskSeat(desk: DeskSpec, deskIndex: number): OfficeSeat {
  return { roomId: desk.roomId, x: desk.x + 0.8, y: desk.y - 0.45, deskIndex };
}

/** Pontos em pé, usados quando as mesas da sala acabam. */
export const STANDING_SPOTS: OfficeSeat[] = [
  { roomId: "strategy", x: 5.2, y: 11.2 },
  { roomId: "strategy", x: 7.6, y: 11.2 },
  { roomId: "lobby", x: 21.4, y: 12.2 },
  { roomId: "lobby", x: 24.6, y: 12.2 },
  { roomId: "lobby", x: 26.4, y: 11.2 },
  { roomId: "lobby", x: 22.4, y: 14.2 },
  { roomId: "review", x: 24.0, y: 5.6 },
  { roomId: "publishing", x: 15.0, y: 11.2 },
  { roomId: "research", x: 7.4, y: 5.8 },
  { roomId: "creative", x: 14.0, y: 5.8 },
  { roomId: "creative", x: 18.0, y: 5.8 },
];

/** Onde o avatar humano começa e o tile de entrada do prédio. */
export const USER_START = { x: 23.2, y: 13.5 };

export type FurnitureSpec =
  | { type: "chair"; x: number; y: number }
  | { type: "plant"; x: number; y: number; size?: number }
  | { type: "bookshelf"; x: number; y: number; alongY?: boolean }
  | { type: "sofa"; x: number; y: number; w?: number }
  | { type: "rug"; x: number; y: number; w: number; d: number; color: number; line: number }
  | { type: "counter"; x: number; y: number; w: number; d: number; h: number; color?: number }
  | { type: "coffee"; x: number; y: number; z: number }
  | { type: "cooler"; x: number; y: number }
  | { type: "printer"; x: number; y: number }
  | { type: "packages"; x: number; y: number }
  | { type: "cabinet"; x: number; y: number }
  | { type: "lamp"; x: number; y: number }
  | { type: "table"; x: number; y: number; r: number }
  | { type: "coffeeTable"; x: number; y: number }
  | { type: "whiteboard"; x: number; yf: number; len: number; z: number; h: number; variant: "chart" | "mood" | "check" | "calendar" | "plan" }
  | { type: "screen"; x: number; yf: number; len: number; z: number; h: number }
  | { type: "orbitMark"; x: number; yf: number; z: number; r: number; side?: "n" | "s" };

/** Janela numa parede externa do prédio: `from` é a posição ao longo da parede (x para norte/sul, y para leste/oeste). */
export interface WindowSpec {
  side: "n" | "s" | "e" | "w";
  from: number;
  len: number;
  z?: number;
  h?: number;
}

/** Janelas em todas as fachadas: só as duas do fundo aparecem em cada orientação da câmera. */
export const WINDOWS: WindowSpec[] = [
  { side: "n", from: 2.5, len: 2.0 }, { side: "n", from: 5.5, len: 2.0 }, { side: "n", from: 13, len: 2.5 }, { side: "n", from: 16.5, len: 2.5 }, { side: "n", from: 24.5, len: 3.0 },
  { side: "w", from: 2.4, len: 2.2 }, { side: "w", from: 10.2, len: 2.6 },
  { side: "s", from: 3, len: 2.0 }, { side: "s", from: 6.5, len: 2.0 }, { side: "s", from: 12.5, len: 2.5 }, { side: "s", from: 20.5, len: 2.5 }, { side: "s", from: 25, len: 2.5 },
  { side: "e", from: 2.5, len: 2.0 }, { side: "e", from: 10, len: 2.2 }, { side: "e", from: 13, len: 1.6 },
];

/** Mobília fixa, além das mesas do `DESKS` (cada mesa já traz sua cadeira). */
export const FURNITURE: FurnitureSpec[] = [
  // tapetes (chão)
  { type: "rug", x: 13, y: 5.1, w: 4.2, d: 1.5, color: 0x6a5a8a, line: 0x4d4068 },
  { type: "rug", x: 20.2, y: 10.5, w: 4.6, d: 3.2, color: 0xa45c4f, line: 0x7f4238 },
  { type: "rug", x: 24.4, y: 3.2, w: 3.4, d: 2.4, color: 0x8fb3a0, line: 0x6f9482 },
  { type: "rug", x: 4.6, y: 10.9, w: 4.0, d: 3.2, color: 0x5f8f9c, line: 0x4a7681 },

  // marca OrbitMind nas fachadas norte e sul (aparece a que estiver no fundo)
  { type: "orbitMark", x: 10, yf: 1.0, z: 1.5, r: 0.42, side: "n" },
  { type: "orbitMark", x: 19, yf: 15.0, z: 1.5, r: 0.42, side: "s" },

  // Pesquisa
  { type: "whiteboard", x: 3.2, yf: 1.02, len: 2.4, z: 1.0, h: 0.8, variant: "chart" },
  { type: "bookshelf", x: 1.15, y: 4.2, alongY: true },
  { type: "plant", x: 8.2, y: 6.2 },
  { type: "plant", x: 1.3, y: 1.3, size: 0.8 },
  { type: "cooler", x: 8.2, y: 1.3 },
  { type: "lamp", x: 1.4, y: 6.2 },

  // Estúdio Criativo
  { type: "whiteboard", x: 13.2, yf: 1.02, len: 3.2, z: 1.0, h: 0.8, variant: "mood" },
  { type: "bookshelf", x: 11.2, y: 1.4, alongY: true },
  { type: "printer", x: 19.6, y: 5.6 },
  { type: "plant", x: 20.2, y: 1.4 },
  { type: "plant", x: 11.3, y: 6.2 },
  { type: "lamp", x: 20.2, y: 6.3 },

  // Revisão
  { type: "whiteboard", x: 24.2, yf: 1.02, len: 2.6, z: 1.0, h: 0.8, variant: "check" },
  { type: "plant", x: 23.4, y: 6.2 },
  { type: "plant", x: 28.2, y: 6.2 },
  { type: "cabinet", x: 28.3, y: 1.3 },

  // Estratégia
  { type: "table", x: 6.6, y: 12.4, r: 0.95 },
  { type: "chair", x: 5.2, y: 11.4 },
  { type: "chair", x: 7.4, y: 11.4 },
  { type: "chair", x: 5.2, y: 13.0 },
  { type: "chair", x: 7.4, y: 13.0 },
  { type: "whiteboard", x: 2.6, yf: 9.2, len: 3.8, z: 0.45, h: 0.72, variant: "plan" },
  { type: "plant", x: 8.2, y: 14.2 },
  { type: "cabinet", x: 1.2, y: 13.4 },

  // Publicação
  { type: "whiteboard", x: 12.0, yf: 9.2, len: 2.6, z: 0.45, h: 0.72, variant: "calendar" },
  { type: "bookshelf", x: 11.2, y: 12.6, alongY: true },
  { type: "packages", x: 15.4, y: 13.2 },
  { type: "plant", x: 16.2, y: 14.2 },
  { type: "lamp", x: 16.2, y: 9.4 },

  // Lobby
  { type: "sofa", x: 20.6, y: 10.6, w: 1.9 },
  { type: "sofa", x: 20.3, y: 12.7, w: 0.85 },
  { type: "sofa", x: 23.6, y: 12.7, w: 0.85 },
  { type: "coffeeTable", x: 22.0, y: 11.75 },
  { type: "counter", x: 25.4, y: 9.3, w: 2.2, d: 0.62, h: 0.92, color: 0x3a3733 },
  { type: "coffee", x: 25.55, y: 9.35, z: 0.92 },
  { type: "counter", x: 25.6, y: 13.0, w: 2.4, d: 0.7, h: 1.0, color: 0x1a1a17 },
  { type: "orbitMark", x: 26.2, yf: 13.72, z: 0.42, r: 0.32, side: "n" },
  { type: "screen", x: 22.4, yf: 9.2, len: 1.6, z: 0.4, h: 0.72 },
  { type: "plant", x: 19.3, y: 14.2 },
  { type: "plant", x: 28.2, y: 9.4, size: 1.15 },
  { type: "plant", x: 19.3, y: 9.4, size: 0.9 },
  { type: "cooler", x: 28.2, y: 14.2 },
  { type: "lamp", x: 24.6, y: 14.3 },
];

/** Células bloqueadas para navegação (footprint da mobília), em tiles inteiros. */
export function blockedCells(): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  const block = (x: number, y: number, w: number, d: number): void => {
    for (let cx = Math.floor(x); cx < Math.ceil(x + w); cx++) {
      for (let cy = Math.floor(y); cy < Math.ceil(y + d); cy++) cells.push([cx, cy]);
    }
  };
  for (const desk of DESKS) block(desk.x, desk.y, 1.6, 0.8);
  for (const f of FURNITURE) {
    switch (f.type) {
      case "bookshelf": block(f.x, f.y, f.alongY === false ? 1.4 : 0.42, f.alongY === false ? 0.42 : 1.4); break;
      case "sofa": block(f.x, f.y, f.w ?? 1.8, 0.85); break;
      case "counter": block(f.x, f.y, f.w, f.d); break;
      case "table": block(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); break;
      case "coffeeTable": block(f.x, f.y, 0.9, 0.55); break;
      case "cabinet": block(f.x, f.y, 0.5, 1.2); break;
      case "printer": block(f.x, f.y, 0.75, 0.6); break;
      case "packages": block(f.x, f.y, 0.7, 0.7); break;
      case "cooler": block(f.x, f.y, 0.36, 0.36); break;
      case "plant": block(f.x, f.y, 0.4, 0.4); break;
      case "lamp": block(f.x, f.y, 0.25, 0.25); break;
      default: break;
    }
  }
  return cells;
}

/** Cores de camisa e cabelo por papel (id do agente ou primeira palavra do papel). */
export const AGENT_COLORS: Record<string, { primary: number; hair: number; skin: number }> = {
  researcher: { primary: 0x2f6fd6, hair: 0x3b2a1a, skin: 0xf0c8a2 },
  pesquisador: { primary: 0x2f6fd6, hair: 0x3b2a1a, skin: 0xf0c8a2 },
  pesquisadora: { primary: 0x2f6fd6, hair: 0x3b2a1a, skin: 0xf0c8a2 },
  strategist: { primary: 0x0b8fa8, hair: 0x1a1a17, skin: 0xc99671 },
  estrategista: { primary: 0x0b8fa8, hair: 0x1a1a17, skin: 0xc99671 },
  copywriter: { primary: 0x7c5cff, hair: 0x6b4423, skin: 0xc99671 },
  redator: { primary: 0x7c5cff, hair: 0x6b4423, skin: 0xc99671 },
  designer: { primary: 0xe0457b, hair: 0xc0392b, skin: 0xf0c8a2 },
  "seo-analyst": { primary: 0x14a3a3, hair: 0x1a1a17, skin: 0x8d5a3b },
  analista: { primary: 0x14a3a3, hair: 0x1a1a17, skin: 0x8d5a3b },
  reviewer: { primary: 0x2e8b57, hair: 0xb0b0b0, skin: 0xf0c8a2 },
  revisor: { primary: 0x2e8b57, hair: 0xb0b0b0, skin: 0xf0c8a2 },
  revisora: { primary: 0x2e8b57, hair: 0xb0b0b0, skin: 0xf0c8a2 },
  publisher: { primary: 0xd98e04, hair: 0xf0d58c, skin: 0xf0c8a2 },
  publicador: { primary: 0xd98e04, hair: 0xf0d58c, skin: 0xf0c8a2 },
  publicadora: { primary: 0xd98e04, hair: 0xf0d58c, skin: 0xf0c8a2 },
  // Dev pipeline
  developer: { primary: 0x2f6fd6, hair: 0x1a1a17, skin: 0xc99671 },
  desenvolvedor: { primary: 0x2f6fd6, hair: 0x1a1a17, skin: 0xc99671 },
  desenvolvedora: { primary: 0x2f6fd6, hair: 0x6b4423, skin: 0xf0c8a2 },
  autofix: { primary: 0xf97316, hair: 0x6b4423, skin: 0xf0c8a2 },
  architect: { primary: 0x8b5cf6, hair: 0xa67c52, skin: 0xc99671 },
  arquiteto: { primary: 0x8b5cf6, hair: 0xa67c52, skin: 0xc99671 },
  docs: { primary: 0x14b8a6, hair: 0xf0d58c, skin: 0xf0c8a2 },
  ideator: { primary: 0xeab308, hair: 0x1a1a17, skin: 0x8d5a3b },
  taskmaster: { primary: 0x6366f1, hair: 0xb0b0b0, skin: 0xc99671 },
  qa: { primary: 0xef4444, hair: 0x6b4423, skin: 0xf0c8a2 },
  code: { primary: 0x2e8b57, hair: 0x1a1a17, skin: 0x8d5a3b },
  release: { primary: 0x22c55e, hair: 0x1a1a17, skin: 0xc99671 },
  devops: { primary: 0x22c55e, hair: 0x1a1a17, skin: 0xc99671 },
  rebase: { primary: 0x64748b, hair: 0xa67c52, skin: 0xf0c8a2 },
  "project-sync": { primary: 0x0ea5e9, hair: 0xf0d58c, skin: 0xc99671 },
  default: { primary: 0x8b5cf6, hair: 0x6b4423, skin: 0xf0c8a2 },
};

const EXTRA_PALETTE = [0x2f6fd6, 0xe0457b, 0x14a3a3, 0xd98e04, 0x7c5cff, 0x2e8b57, 0x0b8fa8, 0xf97316];
const HAIR_PALETTE = [0x3b2a1a, 0x1a1a17, 0xc0392b, 0xf0d58c, 0xb0b0b0, 0x6b4423];
const SKIN_PALETTE = [0xf0c8a2, 0xc99671, 0x8d5a3b];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Cores para um agente: pelo papel; se desconhecido, determinístico pelo id. */
export function colorsForAgent(role: string, id: string): { primary: number; hair: number; skin: number } {
  const key = role.toLowerCase().split(/\s+/)[0] ?? "";
  const byRole = AGENT_COLORS[key];
  if (byRole) return byRole;
  const h = hashString(id);
  return {
    primary: EXTRA_PALETTE[h % EXTRA_PALETTE.length]!,
    hair: HAIR_PALETTE[(h >> 3) % HAIR_PALETTE.length]!,
    skin: SKIN_PALETTE[(h >> 6) % SKIN_PALETTE.length]!,
  };
}

/** Aparência de um agente: cores pelo papel; se o papel é desconhecido, determinísticas pelo id. */
export function lookForAgent(role: string, id: string): AvatarLook {
  const colors = colorsForAgent(role, id);
  return { shirt: colors.primary, hair: colors.hair, skin: colors.skin };
}

/** Sala de um agente a partir do papel. */
export function getRoomForRole(role: string): string {
  const lower = role.toLowerCase();
  // Marketing
  if (lower.includes("pesquis") || lower.includes("research") || lower.includes("analista") || lower.includes("seo")) return "research";
  if (lower.includes("estrat") || lower.includes("strateg") || lower.includes("planej")) return "strategy";
  if (lower.includes("copy") || lower.includes("conteud") || lower.includes("cri") || lower.includes("redat")) return "creative";
  if (lower.includes("revis") || lower.includes("review") || lower.includes("qualid")) return "review";
  if (lower.includes("public") || lower.includes("post") || lower.includes("social") || lower.includes("midia")) return "publishing";
  // Dev
  if (lower.includes("develop") || lower.includes("desenvolv") || lower.includes("autofix") || lower.includes("design") || lower.includes("frontend") || lower.includes("backend")) return "creative";
  if (lower.includes("architect") || lower.includes("arquitet") || lower.includes("taskmaster") || lower.includes("ideator")) return "strategy";
  if (lower.includes("docs")) return "research";
  if (lower.includes("qa") || lower.includes("test")) return "review";
  if (lower.includes("release") || lower.includes("deploy") || lower.includes("devops") || lower.includes("rebase") || lower.includes("project-sync")) return "publishing";
  return "lobby";
}

/** Rótulo curto da sala. */
export function roomName(roomId: string): string {
  return OFFICE_ROOMS.find((r) => r.id === roomId)?.name ?? roomId;
}
