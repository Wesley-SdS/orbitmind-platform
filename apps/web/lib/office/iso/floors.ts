import { Graphics } from "pixi.js";
import { poly, toScreen } from "./projection";
import { FLOOR_COLORS, PALETTE } from "./palette";
import { drawBox } from "./draw";
import type { OfficeRoom } from "@/lib/office/types";

/** Gramado, sombra projetada, laje e piso de concreto dos corredores. */
export function drawBuildingBase(ground: Graphics, shadows: Graphics, W: number, D: number): void {
  // gramado em volta
  ground.poly(poly([[-1.2, -1.2], [W + 1.6, -1.2], [W + 1.6, D + 1.6], [-1.2, D + 1.6]])).fill(PALETTE.grass);
  for (let x = -1; x < W + 1.6; x += 1) {
    for (let y = -1; y < D + 1.6; y += 1) {
      const inside = x >= 0 && x < W && y >= 0 && y < D;
      if (inside) continue;
      const a = toScreen(x + 0.25, y + 0.3);
      const b = toScreen(x + 0.7, y + 0.75);
      ground.circle(a.x, a.y, 1.6).fill(PALETTE.grassDark);
      ground.circle(b.x, b.y, 2).fill(PALETTE.grassLight);
    }
  }
  // sombra da laje
  shadows.poly(poly([[0.6, 0.6], [W + 0.9, 0.6], [W + 0.9, D + 0.9], [0.6, D + 0.9]])).fill({ color: 0x1a1a17, alpha: 0.35 });
  // laje
  drawBox(ground, 0, 0, -0.5, W, D, 0.5, PALETTE.slab, { top: PALETTE.slabTop, left: 0xa89f90, right: 0x8f8677 });
  // concreto com grade
  ground.poly(poly([[0, 0], [W, 0], [W, D], [0, D]])).fill(PALETTE.concrete);
  for (let x = 0; x <= W; x++) {
    const a = toScreen(x, 0);
    const b = toScreen(x, D);
    ground.moveTo(a.x, a.y).lineTo(b.x, b.y);
  }
  for (let y = 0; y <= D; y++) {
    const a = toScreen(0, y);
    const b = toScreen(W, y);
    ground.moveTo(a.x, a.y).lineTo(b.x, b.y);
  }
  ground.stroke({ width: 0.7, color: PALETTE.concreteLine, alpha: 0.7 });
}

/** Piso de uma sala, com o padrão do material desenhado tile a tile. */
export function drawRoomFloor(g: Graphics, room: OfficeRoom): void {
  const { x, y, w, h } = room;
  const x1 = x + w;
  const y1 = y + h;
  const quad = (ax: number, ay: number, bx: number, by: number): number[] => poly([[ax, ay], [bx, ay], [bx, by], [ax, by]]);

  switch (room.floor) {
    case "wood": {
      const c = FLOOR_COLORS.wood;
      g.poly(quad(x, y, x1, y1)).fill(c.base);
      // tábuas ao longo de x, 3 por tile, comprimento 2 com desencontro
      let row = 0;
      for (let v = y; v < y1 - 1e-6; v += 1 / 3, row++) {
        const v2 = Math.min(y1, v + 1 / 3);
        const offset = (row % 3) * 0.66;
        for (let u = x - 2 + offset; u < x1; u += 2) {
          const u0 = Math.max(x, u);
          const u1 = Math.min(x1, u + 2);
          if (u1 <= u0) continue;
          const shadeIdx = (row + Math.round((u - x) / 2)) % 3;
          const color = shadeIdx === 0 ? c.a : shadeIdx === 1 ? c.b : c.base;
          g.poly(quad(u0, v, u1, v2)).fill(color);
          const p1 = toScreen(u1, v);
          const p2 = toScreen(u1, v2);
          g.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ width: 0.6, color: c.line, alpha: 0.9 });
        }
        const l1 = toScreen(x, v2);
        const l2 = toScreen(x1, v2);
        g.moveTo(l1.x, l1.y).lineTo(l2.x, l2.y).stroke({ width: 0.6, color: c.line, alpha: 0.7 });
      }
      break;
    }
    case "darkwood": {
      const c = FLOOR_COLORS.darkwood;
      g.poly(quad(x, y, x1, y1)).fill(c.base);
      let col = 0;
      for (let u = x; u < x1 - 1e-6; u += 1 / 3, col++) {
        const u2 = Math.min(x1, u + 1 / 3);
        const offset = (col % 3) * 0.66;
        for (let v = y - 2 + offset; v < y1; v += 2) {
          const v0 = Math.max(y, v);
          const v1 = Math.min(y1, v + 2);
          if (v1 <= v0) continue;
          const shadeIdx = (col + Math.round((v - y) / 2)) % 3;
          const color = shadeIdx === 0 ? c.a : shadeIdx === 1 ? c.b : c.base;
          g.poly(quad(u, v0, u2, v1)).fill(color);
          const p1 = toScreen(u, v1);
          const p2 = toScreen(u2, v1);
          g.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ width: 0.6, color: c.line, alpha: 0.9 });
        }
        const l1 = toScreen(u2, y);
        const l2 = toScreen(u2, y1);
        g.moveTo(l1.x, l1.y).lineTo(l2.x, l2.y).stroke({ width: 0.6, color: c.line, alpha: 0.7 });
      }
      break;
    }
    case "carpet": {
      const c = FLOOR_COLORS.carpet;
      g.poly(quad(x, y, x1, y1)).fill(c.base);
      for (let u = x; u < x1; u += 0.5) {
        for (let v = y; v < y1; v += 0.5) {
          const a = toScreen(u + 0.12, v + 0.12);
          const b = toScreen(u + 0.37, v + 0.37);
          const c1 = toScreen(u + 0.37, v + 0.12);
          const d = toScreen(u + 0.12, v + 0.37);
          g.circle(a.x, a.y, 1.1).fill(c.dotLight);
          g.circle(b.x, b.y, 1.1).fill(c.dotLight);
          g.circle(c1.x, c1.y, 0.8).fill(c.dotDark);
          g.circle(d.x, d.y, 0.8).fill(c.dotDark);
        }
      }
      break;
    }
    case "tile": {
      const c = FLOOR_COLORS.tile;
      g.poly(quad(x, y, x1, y1)).fill(c.base);
      for (let u = x; u < x1; u++) {
        for (let v = y; v < y1; v++) {
          g.poly(quad(u + 0.06, v + 0.06, u + 0.94, v + 0.94)).stroke({ width: 0.6, color: c.inner, alpha: 0.9 });
        }
      }
      for (let u = x; u <= x1; u++) { const a = toScreen(u, y); const b = toScreen(u, y1); g.moveTo(a.x, a.y).lineTo(b.x, b.y); }
      for (let v = y; v <= y1; v++) { const a = toScreen(x, v); const b = toScreen(x1, v); g.moveTo(a.x, a.y).lineTo(b.x, b.y); }
      g.stroke({ width: 0.8, color: c.line, alpha: 0.9 });
      break;
    }
    case "parquet": {
      const c = FLOOR_COLORS.parquet;
      g.poly(quad(x, y, x1, y1)).fill(c.base);
      for (let u = x; u < x1; u += 0.5) {
        for (let v = y; v < y1; v += 0.5) {
          const alt = (Math.round((u - x) * 2) + Math.round((v - y) * 2)) % 2 === 0;
          if (alt) g.poly(quad(u, v, u + 0.5, v + 0.5)).fill(c.alt);
          // ripas: horizontais nos claros, verticais nos escuros
          for (let k = 1; k < 3; k++) {
            const t = k / 3 * 0.5;
            const a = alt ? toScreen(u, v + t) : toScreen(u + t, v);
            const b = alt ? toScreen(u + 0.5, v + t) : toScreen(u + t, v + 0.5);
            g.moveTo(a.x, a.y).lineTo(b.x, b.y);
          }
        }
      }
      g.stroke({ width: 0.5, color: c.line, alpha: 0.8 });
      break;
    }
    case "stone": {
      const c = FLOOR_COLORS.stone;
      g.poly(quad(x, y, x1, y1)).fill(c.base);
      for (let u = x; u < x1; u++) {
        for (let v = y; v < y1; v++) {
          const k = (u - x + v - y) % 3;
          if (k === 0) g.poly(quad(u, v, u + 1, v + 1)).fill(c.a);
          else if (k === 1) g.poly(quad(u, v, u + 1, v + 1)).fill(c.b);
        }
      }
      for (let u = x; u <= x1; u++) { const a = toScreen(u, y); const b = toScreen(u, y1); g.moveTo(a.x, a.y).lineTo(b.x, b.y); }
      for (let v = y; v <= y1; v++) { const a = toScreen(x, v); const b = toScreen(x1, v); g.moveTo(a.x, a.y).lineTo(b.x, b.y); }
      g.stroke({ width: 0.8, color: c.line, alpha: 0.9 });
      break;
    }
  }
}

/** Luz global: mais claro no canto superior esquerdo, mais escuro no inferior direito. */
export function drawGlobalLight(g: Graphics, W: number, D: number): void {
  // dois véus triangulares em vez de gradiente: barato e suficiente
  g.poly(poly([[0, 0], [W, 0], [0, D]])).fill({ color: 0xffffff, alpha: 0.07 });
  g.poly(poly([[W, 0], [W, D], [0, D]])).fill({ color: 0x1a1a17, alpha: 0.06 });
}

/** Oclusão de ambiente nas bases das paredes de fundo de uma sala. */
export function drawWallAO(g: Graphics, room: OfficeRoom): void {
  const { x, y, w, h } = room;
  g.poly(poly([[x, y + 0.1], [x + w, y + 0.1], [x + w, y + 0.6], [x, y + 0.6]])).fill({ color: 0x1a1a17, alpha: 0.13 });
  g.poly(poly([[x + 0.1, y], [x + 0.6, y], [x + 0.6, y + h], [x + 0.1, y + h]])).fill({ color: 0x1a1a17, alpha: 0.13 });
}

/** Tapete no chão com duas bordas internas. */
export function drawRug(g: Graphics, x: number, y: number, w: number, d: number, color: number, line: number): void {
  g.poly(poly([[x, y], [x + w, y], [x + w, y + d], [x, y + d]])).fill(color);
  g.poly(poly([[x + 0.18, y + 0.18], [x + w - 0.18, y + 0.18], [x + w - 0.18, y + d - 0.18], [x + 0.18, y + d - 0.18]])).stroke({ width: 2, color: line });
  g.poly(poly([[x + 0.34, y + 0.34], [x + w - 0.34, y + 0.34], [x + w - 0.34, y + d - 0.34], [x + 0.34, y + d - 0.34]])).stroke({ width: 1, color: line, alpha: 0.6 });
}
