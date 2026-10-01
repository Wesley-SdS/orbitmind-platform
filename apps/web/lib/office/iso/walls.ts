import { Graphics } from "pixi.js";
import { depthOf, isoRaw, poly, rotRect, rotatedSide, type Side } from "./projection";
import { PALETTE } from "./palette";
import { drawBox } from "./draw";
import type { OfficeRoom } from "@/lib/office/types";
import {
  EXTERIOR_WALL_HEIGHT, EXTERIOR_WALL_THICKNESS, GLASS_HEIGHT, WALL_HEIGHT, WALL_THICKNESS,
  BUILDING_W, BUILDING_D,
} from "@/lib/office/room-layout";
import type { NavGrid } from "./pathfinding";

export type AddObject = (display: Graphics, depth: number) => void;

function inDoor(i: number, doors: Array<[number, number]>): boolean {
  const c = i + 0.5;
  return doors.some(([a, b]) => c > a && c < b);
}

/** Segmento de parede (footprint no mundo) desenhado como caixa sólida. */
function solidSegment(add: AddObject, x: number, y: number, w: number, d: number, h: number): void {
  const g = new Graphics();
  drawBox(g, x, y, 0, w, d, h, PALETTE.wall, { top: PALETTE.wallTopCap });
  add(g, depthOf(x, y, w, d));
}

/** Segmento de divisória de vidro: face translúcida voltada para a câmera, moldura e tampo claro. */
function glassSegment(add: AddObject, x: number, y: number, w: number, d: number, h: number): void {
  const r = rotRect(x, y, w, d);
  const P = (px: number, py: number, pz: number): number[] => { const s = isoRaw(px, py, pz); return [s.x, s.y]; };
  const alongX = r.w > r.d; // no espaço rotacionado
  const g = new Graphics();
  const face = alongX
    ? [...P(r.x, r.y + r.d, 0), ...P(r.x + r.w, r.y + r.d, 0), ...P(r.x + r.w, r.y + r.d, h), ...P(r.x, r.y + r.d, h)]
    : [...P(r.x + r.w, r.y, 0), ...P(r.x + r.w, r.y + r.d, 0), ...P(r.x + r.w, r.y + r.d, h), ...P(r.x + r.w, r.y, h)];
  const hi = alongX
    ? [...P(r.x, r.y + r.d, h * 0.55), ...P(r.x + r.w, r.y + r.d, h * 0.55), ...P(r.x + r.w, r.y + r.d, h), ...P(r.x, r.y + r.d, h)]
    : [...P(r.x + r.w, r.y, h * 0.55), ...P(r.x + r.w, r.y + r.d, h * 0.55), ...P(r.x + r.w, r.y + r.d, h), ...P(r.x + r.w, r.y, h)];
  g.poly(face).fill({ color: PALETTE.glass, alpha: 0.32 });
  g.poly(hi).fill({ color: 0xffffff, alpha: 0.18 });
  g.poly(face).stroke({ width: 0.8, color: PALETTE.glassFrame, alpha: 0.7 });
  g.poly([...P(r.x, r.y, h), ...P(r.x + r.w, r.y, h), ...P(r.x + r.w, r.y + r.d, h), ...P(r.x, r.y + r.d, h)]).fill(PALETTE.glassCap);
  add(g, depthOf(x, y, w, d));
}

function doorPost(add: AddObject, x: number, y: number, w: number, d: number, h: number): void {
  const g = new Graphics();
  drawBox(g, x, y, 0, w, d, h, PALETTE.doorFrame);
  add(g, depthOf(x, y, w, d, 0.02));
}

interface WallRun {
  /** início da parede no mundo */
  x0: number;
  y0: number;
  len: number;
  alongX: boolean;
  t: number;
  doors: Array<[number, number]>;
  kind: "solid" | "glass";
  h: number;
}

/** Constrói uma parede do mundo, tile a tile, com portas (batentes + capacho). */
function buildRun(add: AddObject, ground: Graphics, run: WallRun): void {
  const { x0, y0, len, alongX, t, doors, kind, h } = run;
  for (let i = 0; i < len; i++) {
    if (inDoor(i, doors)) continue;
    const x = alongX ? x0 + i : x0;
    const y = alongX ? y0 : y0 + i;
    const w = alongX ? 1.02 : t;
    const d = alongX ? t : 1.02;
    if (kind === "solid") solidSegment(add, x, y, w, d, h);
    else glassSegment(add, x, y, w, d, h);
  }
  for (const [a, b] of doors) {
    if (alongX) {
      doorPost(add, x0 + a - 0.1, y0 - 0.02, 0.1, t + 0.04, h + 0.12);
      doorPost(add, x0 + b, y0 - 0.02, 0.1, t + 0.04, h + 0.12);
    } else {
      doorPost(add, x0 - 0.02, y0 + a - 0.1, t + 0.04, 0.1, h + 0.12);
      doorPost(add, x0 - 0.02, y0 + b, t + 0.04, 0.1, h + 0.12);
    }
    const mat = alongX
      ? poly([[x0 + a + 0.1, y0 - 0.35], [x0 + b - 0.1, y0 - 0.35], [x0 + b - 0.1, y0 + t + 0.35], [x0 + a + 0.1, y0 + t + 0.35]])
      : poly([[x0 - 0.35, y0 + a + 0.1], [x0 + t + 0.35, y0 + a + 0.1], [x0 + t + 0.35, y0 + b - 0.1], [x0 - 0.35, y0 + b - 0.1]]);
    ground.poly(mat).fill({ color: 0x1a1a17, alpha: 0.08 });
  }
}

/** Lado do mundo que, nesta orientação, fica no fundo (norte/oeste rotacionado) e ganha parede sólida. */
export function isBackSide(side: Side): boolean {
  const r = rotatedSide(side);
  return r === "n" || r === "w";
}

/** A sala encosta na parede externa do prédio por esse lado? */
export function touchesExterior(room: OfficeRoom, side: Side): boolean {
  if (side === "n") return room.y === 1;
  if (side === "w") return room.x === 1;
  if (side === "s") return room.y + room.h === BUILDING_D - 1;
  return room.x + room.w === BUILDING_W - 1;
}

/**
 * Constrói as paredes externas (só nos dois lados do fundo, em corte) e as
 * paredes das salas (sólidas no fundo, vidro na frente), tudo em coordenadas
 * de mundo. Registra as arestas bloqueadas no grid de navegação.
 */
export function buildAllWalls(add: AddObject, ground: Graphics, rooms: OfficeRoom[], nav: NavGrid): void {
  const T = EXTERIOR_WALL_THICKNESS;
  const H = EXTERIOR_WALL_HEIGHT;
  const W = BUILDING_W;
  const D = BUILDING_D;
  // paredes externas nos lados de fundo desta orientação
  if (isBackSide("n")) buildRun(add, ground, { x0: 0.7, y0: 1 - T, len: W, alongX: true, t: T, doors: [], kind: "solid", h: H });
  if (isBackSide("s")) buildRun(add, ground, { x0: 0.7, y0: D - 1, len: W, alongX: true, t: T, doors: [], kind: "solid", h: H });
  if (isBackSide("w")) buildRun(add, ground, { x0: 1 - T, y0: 1, len: D - 1, alongX: false, t: T, doors: [], kind: "solid", h: H });
  if (isBackSide("e")) buildRun(add, ground, { x0: W - 1, y0: 1, len: D - 1, alongX: false, t: T, doors: [], kind: "solid", h: H });
  for (let x = 0; x < W; x++) { nav.blockCell(x, 0); nav.blockCell(x, D - 1); }
  for (let y = 0; y < D; y++) { nav.blockCell(0, y); nav.blockCell(W - 1, y); }

  for (const r of rooms) {
    const d = r.doors;
    const x1 = r.x + r.w;
    const y1 = r.y + r.h;
    const sideRun = (side: Side): void => {
      const back = isBackSide(side);
      // sala encostada na parede externa deste lado: a externa já faz o papel
      if (back && touchesExterior(r, side)) return;
      const kind = back ? "solid" : "glass";
      const h = back ? WALL_HEIGHT : GLASS_HEIGHT;
      const t = back ? WALL_THICKNESS : 0.06;
      const doors = d[side] ? [d[side]!] : [];
      switch (side) {
        case "n": buildRun(add, ground, { x0: r.x, y0: r.y, len: r.w, alongX: true, t, doors, kind, h }); break;
        case "s": buildRun(add, ground, { x0: r.x, y0: y1 - t, len: r.w, alongX: true, t, doors, kind, h }); break;
        case "w": buildRun(add, ground, { x0: r.x, y0: r.y, len: r.h, alongX: false, t, doors, kind, h }); break;
        case "e": buildRun(add, ground, { x0: x1 - t, y0: r.y, len: r.h, alongX: false, t, doors, kind, h }); break;
      }
    };
    (["n", "w", "s", "e"] as Side[]).forEach(sideRun);

    // arestas bloqueadas (com passagem nas portas), sempre em coordenadas de mundo
    for (let i = 0; i < r.w; i++) {
      if (!(d.n && inDoor(i, [d.n]))) nav.blockEdge(r.x + i, r.y - 1, r.x + i, r.y);
      if (!(d.s && inDoor(i, [d.s]))) nav.blockEdge(r.x + i, y1 - 1, r.x + i, y1);
    }
    for (let i = 0; i < r.h; i++) {
      if (!(d.w && inDoor(i, [d.w]))) nav.blockEdge(r.x - 1, r.y + i, r.x, r.y + i);
      if (!(d.e && inDoor(i, [d.e]))) nav.blockEdge(x1 - 1, r.y + i, x1, r.y + i);
    }
  }
}
