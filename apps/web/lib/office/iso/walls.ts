import { Graphics } from "pixi.js";
import { poly } from "./projection";
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

/** Parede sólida dividida em segmentos de 1 tile (cada um com sua profundidade). */
export function buildSolidWall(
  add: AddObject, ground: Graphics,
  x0: number, y0: number, len: number, alongX: boolean, h: number, t: number,
  doors: Array<[number, number]> = [],
): void {
  for (let i = 0; i < len; i++) {
    if (inDoor(i, doors)) continue;
    const g = new Graphics();
    if (alongX) {
      drawBox(g, x0 + i, y0, 0, 1.02, t, h, PALETTE.wall, { top: PALETTE.wallTopCap });
      add(g, x0 + i + 1.02 + y0 + t);
    } else {
      drawBox(g, x0, y0 + i, 0, t, 1.02, h, PALETTE.wall, { top: PALETTE.wallTopCap });
      add(g, x0 + t + y0 + i + 1.02);
    }
  }
  for (const [a, b] of doors) {
    const post = (px: number, py: number): void => {
      const g = new Graphics();
      if (alongX) drawBox(g, px, py - 0.02, 0, 0.1, t + 0.04, h + 0.12, PALETTE.doorFrame);
      else drawBox(g, px - 0.02, py, 0, t + 0.04, 0.1, h + 0.12, PALETTE.doorFrame);
      add(g, alongX ? px + 0.1 + py + t + 0.04 : px + t + 0.04 + py + 0.1);
    };
    if (alongX) { post(x0 + a - 0.1, y0); post(x0 + b, y0); } else { post(x0, y0 + a - 0.1); post(x0, y0 + b); }
    // capacho
    const mat = alongX
      ? poly([[x0 + a + 0.1, y0 - 0.35], [x0 + b - 0.1, y0 - 0.35], [x0 + b - 0.1, y0 + t + 0.35], [x0 + a + 0.1, y0 + t + 0.35]])
      : poly([[x0 - 0.35, y0 + a + 0.1], [x0 + t + 0.35, y0 + a + 0.1], [x0 + t + 0.35, y0 + b - 0.1], [x0 - 0.35, y0 + b - 0.1]]);
    ground.poly(mat).fill({ color: 0x1a1a17, alpha: 0.08 });
  }
}

/** Divisória de vidro (frente das salas): face translúcida com moldura e tampo claro. */
export function buildGlassWall(
  add: AddObject,
  x0: number, y0: number, len: number, alongX: boolean, h: number,
  doors: Array<[number, number]> = [],
): void {
  const t = 0.06;
  for (let i = 0; i < len; i++) {
    if (inDoor(i, doors)) continue;
    const x = alongX ? x0 + i : x0;
    const y = alongX ? y0 : y0 + i;
    const w = alongX ? 1.02 : t;
    const d = alongX ? t : 1.02;
    const g = new Graphics();
    const face = alongX
      ? poly([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]])
      : poly([[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, y, h]]);
    g.poly(face).fill({ color: PALETTE.glass, alpha: 0.32 });
    // reflexo mais claro na parte de cima
    const hi = alongX
      ? poly([[x, y + d, h * 0.55], [x + w, y + d, h * 0.55], [x + w, y + d, h], [x, y + d, h]])
      : poly([[x + w, y, h * 0.55], [x + w, y + d, h * 0.55], [x + w, y + d, h], [x + w, y, h]]);
    g.poly(hi).fill({ color: 0xffffff, alpha: 0.18 });
    g.poly(face).stroke({ width: 0.8, color: PALETTE.glassFrame, alpha: 0.7 });
    g.poly(poly([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]])).fill(PALETTE.glassCap);
    add(g, x + w + y + d);
  }
  for (const [a, b] of doors) {
    const post = (px: number, py: number): void => {
      const g = new Graphics();
      if (alongX) drawBox(g, px, py - 0.02, 0, 0.1, t + 0.04, h + 0.1, PALETTE.doorFrame);
      else drawBox(g, px - 0.02, py, 0, t + 0.04, 0.1, h + 0.1, PALETTE.doorFrame);
      add(g, alongX ? px + 0.1 + py + t + 0.04 : px + t + 0.04 + py + 0.1);
    };
    if (alongX) { post(x0 + a - 0.1, y0); post(x0 + b, y0); } else { post(x0, y0 + a - 0.1); post(x0, y0 + b); }
  }
}

/** Constrói todas as paredes (externas + salas) e registra as arestas bloqueadas no grid. */
export function buildAllWalls(add: AddObject, ground: Graphics, rooms: OfficeRoom[], nav: NavGrid): void {
  // externas: norte (y = 0.7..1) e oeste (x = 0.7..1)
  buildSolidWall(add, ground, 0.7, 0.7, BUILDING_W, true, EXTERIOR_WALL_HEIGHT, EXTERIOR_WALL_THICKNESS);
  buildSolidWall(add, ground, 0.7, 1.0, BUILDING_D - 1, false, EXTERIOR_WALL_HEIGHT, EXTERIOR_WALL_THICKNESS);
  for (let x = 0; x < BUILDING_W; x++) { nav.blockCell(x, 0); }
  for (let y = 0; y < BUILDING_D; y++) { nav.blockCell(0, y); }

  for (const r of rooms) {
    const d = r.doors;
    const x1 = r.x + r.w;
    const y1 = r.y + r.h;
    if (r.y !== 1) buildSolidWall(add, ground, r.x, r.y, r.w, true, WALL_HEIGHT, WALL_THICKNESS, d.n ? [d.n] : []);
    if (r.x !== 1) buildSolidWall(add, ground, r.x, r.y, r.h, false, WALL_HEIGHT, WALL_THICKNESS, d.w ? [d.w] : []);
    buildGlassWall(add, r.x, y1 - 0.06, r.w, true, GLASS_HEIGHT, d.s ? [d.s] : []);
    buildGlassWall(add, x1 - 0.06, r.y, r.h, false, GLASS_HEIGHT, d.e ? [d.e] : []);

    // arestas bloqueadas (com passagem nas portas)
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
