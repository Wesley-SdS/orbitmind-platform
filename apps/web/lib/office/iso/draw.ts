import { Graphics } from "pixi.js";
import { TILE_H, TILE_W, Z_UNIT, poly, toScreen } from "./projection";
import { shade } from "./palette";

export interface BoxOptions {
  top?: number;
  left?: number;
  right?: number;
  alpha?: number;
}

/**
 * Caixa isométrica com três faces visíveis: +y (esquerda), +x (direita) e topo.
 * Luz vem do canto superior esquerdo, então a face esquerda é mais clara.
 */
export function drawBox(
  g: Graphics,
  x: number, y: number, z: number,
  w: number, d: number, h: number,
  color: number,
  o: BoxOptions = {},
): Graphics {
  const top = o.top ?? shade(color, 1.14);
  const left = o.left ?? shade(color, 0.86);
  const right = o.right ?? shade(color, 0.64);
  const alpha = o.alpha ?? 1;
  g.poly(poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])).fill({ color: left, alpha });
  g.poly(poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])).fill({ color: right, alpha });
  g.poly(poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])).fill({ color: top, alpha });
  return g;
}

/** Sombra suave no chão (paralelogramo deslocado). Use numa camada com blur. */
export function drawShadow(g: Graphics, x: number, y: number, w: number, d: number, alpha = 0.22): Graphics {
  const o = 0.12;
  g.poly(poly([[x + o, y + o], [x + w + o, y + o], [x + w + o, y + d + o], [x + o, y + d + o]])).fill({ color: 0x1a1a17, alpha });
  return g;
}

export function drawEllipseShadow(g: Graphics, x: number, y: number, r: number, alpha = 0.25): Graphics {
  const c = toScreen(x, y);
  g.ellipse(c.x, c.y, (r * TILE_W) / 2 * 1.2, (r * TILE_H) / 2 * 1.2).fill({ color: 0x1a1a17, alpha });
  return g;
}

/** Elipse no plano do chão em coordenadas de mundo (raio em tiles). */
export function floorEllipse(g: Graphics, x: number, y: number, r: number, z = 0): { cx: number; cy: number; rx: number; ry: number } {
  const c = toScreen(x, y, z);
  return { cx: c.x, cy: c.y, rx: r * TILE_W * 0.707, ry: r * TILE_H * 0.707 };
}

/** Cilindro vertical (mesa redonda, garrafão, cúpula da luminária). */
export function drawCylinder(
  g: Graphics,
  x: number, y: number, z: number,
  r: number, h: number,
  side: number, top: number,
): Graphics {
  const { cx, cy, rx, ry } = floorEllipse(g, x, y, r, z);
  const hh = h * Z_UNIT;
  g.ellipse(cx, cy, rx, ry).fill(shade(side, 0.8));
  g.rect(cx - rx, cy - hh, rx * 2, hh).fill(side);
  // sombreamento do lado direito
  g.rect(cx, cy - hh, rx, hh).fill({ color: 0x000000, alpha: 0.16 });
  g.ellipse(cx, cy - hh, rx, ry).fill(top);
  return g;
}

/** Ponto sobre a face norte de uma parede (plano y = yf): u ao longo de x, v = altura. */
export function faceN(yf: number): (u: number, v: number) => { x: number; y: number } {
  return (u, v) => toScreen(u, yf, v);
}

/** Ponto sobre a face oeste de uma parede (plano x = xf): u ao longo de y, v = altura. */
export function faceW(xf: number): (u: number, v: number) => { x: number; y: number } {
  return (u, v) => toScreen(xf, u, v);
}

export function flat(points: Array<{ x: number; y: number }>): number[] {
  const out: number[] = [];
  for (const p of points) out.push(p.x, p.y);
  return out;
}

/** Polilinha tracejada em coordenadas de tela. */
export function dashedPolyline(g: Graphics, pts: Array<{ x: number; y: number }>, dash: number, gap: number, style: { width: number; color: number; alpha?: number }): void {
  let carry = 0;
  let on = true;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    const ux = dx / len;
    const uy = dy / len;
    let t = 0;
    while (t < len) {
      const seg = (on ? dash : gap) - carry;
      const end = Math.min(len, t + seg);
      if (on) {
        g.moveTo(a.x + ux * t, a.y + uy * t).lineTo(a.x + ux * end, a.y + uy * end);
      }
      if (end >= len) {
        carry += len - t;
        if (carry >= (on ? dash : gap)) { carry = 0; on = !on; }
        break;
      }
      carry = 0;
      on = !on;
      t = end;
    }
  }
  g.stroke({ width: style.width, color: style.color, alpha: style.alpha ?? 1, cap: "round", join: "round" });
}
