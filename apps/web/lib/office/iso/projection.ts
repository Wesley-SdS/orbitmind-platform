/**
 * Projeção isométrica 2:1 do escritório virtual.
 *
 * O mundo é medido em tiles (1 tile = 1 unidade). `x` cresce para a direita
 * e para baixo na tela, `y` cresce para a esquerda e para baixo. `z` é a
 * altura em unidades e sobe na tela.
 */

export const TILE_W = 40;
export const TILE_H = 20;
export const Z_UNIT = 22;

export interface Vec2 {
  x: number;
  y: number;
}

/** Converte coordenadas de mundo (tiles) em coordenadas de tela (px, escala 1). */
export function toScreen(x: number, y: number, z = 0): Vec2 {
  return {
    x: ((x - y) * TILE_W) / 2,
    y: ((x + y) * TILE_H) / 2 - z * Z_UNIT,
  };
}

/** Converte um ponto de tela (px, escala 1, z = 0) de volta para o mundo. */
export function toWorld(sx: number, sy: number): Vec2 {
  const a = sx / (TILE_W / 2);
  const b = sy / (TILE_H / 2);
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

/** Chave de profundidade para o painter's algorithm (maior = desenhado depois). */
export function depthOf(x: number, y: number, w = 0, d = 0, bias = 0): number {
  return x + w + y + d + bias;
}

/** Lista plana de pontos de tela a partir de cantos no mundo (para Graphics.poly). */
export function poly(points: Array<[number, number, number?]>): number[] {
  const out: number[] = [];
  for (const [x, y, z] of points) {
    const p = toScreen(x, y, z ?? 0);
    out.push(p.x, p.y);
  }
  return out;
}
