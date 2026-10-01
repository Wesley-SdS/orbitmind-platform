/**
 * Projeção isométrica 2:1 do escritório virtual, com rotação da câmera em
 * quatro orientações.
 *
 * O mundo é medido em tiles (1 tile = 1 unidade). Todas as posições da planta
 * ficam em coordenadas de MUNDO (fixas). A rotação é aplicada só na hora de
 * projetar: `rot()` gira o ponto em torno do prédio e `isoRaw()` projeta.
 * Na tela, `x` rotacionado cresce para a direita e para baixo, `y` para a
 * esquerda e para baixo, `z` sobe.
 */

export const TILE_W = 40;
export const TILE_H = 20;
export const Z_UNIT = 22;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  d: number;
}

let rotation = 0;
let baseW = 30;
let baseD = 16;

/** Dimensões do prédio em tiles (necessárias para girar em torno dele). */
export function setBuildingSize(w: number, d: number): void {
  baseW = w;
  baseD = d;
}

/** Orientação da câmera: 0..3 (passos de 90°). */
export function setRotation(r: number): void {
  rotation = ((Math.round(r) % 4) + 4) % 4;
}

export function getRotation(): number {
  return rotation;
}

/** Dimensões do prédio no espaço rotacionado (trocam quando a rotação é ímpar). */
export function rotatedSize(): { w: number; d: number } {
  return rotation % 2 === 0 ? { w: baseW, d: baseD } : { w: baseD, d: baseW };
}

/** Gira um ponto do mundo `rotation` vezes 90°. Cada passo: (x, y) → (d − y, x). */
export function rot(x: number, y: number): Vec2 {
  let px = x;
  let py = y;
  let w = baseW;
  let d = baseD;
  for (let i = 0; i < rotation; i++) {
    const nx = d - py;
    const ny = px;
    px = nx;
    py = ny;
    const t = w; w = d; d = t;
  }
  return { x: px, y: py };
}

/** Inverso de `rot`. */
export function unrot(x: number, y: number): Vec2 {
  let px = x;
  let py = y;
  const { w: w0, d: d0 } = rotatedSize();
  let w = w0;
  let d = d0;
  for (let i = 0; i < rotation; i++) {
    // inverso de (x, y) → (d − y, x) é (x, y) → (y, dPrev − x), onde dPrev = w atual
    const nx = py;
    const ny = w - px;
    px = nx;
    py = ny;
    const t = w; w = d; d = t;
  }
  return { x: px, y: py };
}

/** Gira um vetor de direção (sem translação). Cada passo: (dx, dy) → (−dy, dx). */
export function rotDir(dx: number, dy: number): Vec2 {
  let x = dx;
  let y = dy;
  for (let i = 0; i < rotation; i++) {
    const nx = -y;
    const ny = x;
    x = nx;
    y = ny;
  }
  return { x, y };
}

/** Retângulo do mundo → retângulo alinhado no espaço rotacionado. */
export function rotRect(x: number, y: number, w: number, d: number): Rect {
  const a = rot(x, y);
  const b = rot(x + w, y + d);
  const rx = Math.min(a.x, b.x);
  const ry = Math.min(a.y, b.y);
  return { x: rx, y: ry, w: Math.abs(b.x - a.x), d: Math.abs(b.y - a.y) };
}

/** Projeção pura (sem rotação) de um ponto já no espaço rotacionado. */
export function isoRaw(x: number, y: number, z = 0): Vec2 {
  return {
    x: ((x - y) * TILE_W) / 2,
    y: ((x + y) * TILE_H) / 2 - z * Z_UNIT,
  };
}

/** Coordenadas de mundo (tiles) → tela (px, escala 1), já com a rotação. */
export function toScreen(x: number, y: number, z = 0): Vec2 {
  const r = rot(x, y);
  return isoRaw(r.x, r.y, z);
}

/** Ponto de tela (px, escala 1, z = 0) → mundo, desfazendo a rotação. */
export function toWorld(sx: number, sy: number): Vec2 {
  const a = sx / (TILE_W / 2);
  const b = sy / (TILE_H / 2);
  return unrot((a + b) / 2, (b - a) / 2);
}

/** Chave de profundidade (painter's algorithm) de um footprint do mundo. */
export function depthOf(x: number, y: number, w = 0, d = 0, bias = 0): number {
  const r = rotRect(x, y, w, d);
  return r.x + r.w + r.y + r.d + bias;
}

/** Lista plana de pontos de tela a partir de pontos do mundo (para Graphics.poly). */
export function poly(points: Array<[number, number, number?]>): number[] {
  const out: number[] = [];
  for (const [x, y, z] of points) {
    const p = toScreen(x, y, z ?? 0);
    out.push(p.x, p.y);
  }
  return out;
}

export type Side = "n" | "s" | "e" | "w";

const SIDE_DIR: Record<Side, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

/** Em que lado (do espaço rotacionado) fica um lado do mundo nesta orientação. */
export function rotatedSide(side: Side): Side {
  const [dx, dy] = SIDE_DIR[side];
  const r = rotDir(dx, dy);
  if (r.y < -0.5) return "n";
  if (r.y > 0.5) return "s";
  if (r.x > 0.5) return "e";
  return "w";
}

/** Face de parede com normal (nx, ny) no mundo é visível para a câmera nesta orientação? */
export function faceVisible(nx: number, ny: number): boolean {
  const r = rotDir(nx, ny);
  return r.x > 0.01 || r.y > 0.01;
}
