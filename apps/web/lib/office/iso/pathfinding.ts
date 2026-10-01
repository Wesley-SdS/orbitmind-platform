import type { Vec2 } from "./projection";

/**
 * Grid de navegação em tiles inteiros. Paredes bloqueiam ARESTAS entre células
 * (uma parede fica na linha entre duas fileiras), mobília bloqueia CÉLULAS.
 */
export class NavGrid {
  private readonly blocked: Uint8Array;
  private readonly edges = new Set<string>();
  /** Componente conectado de cada célula (-1 = bloqueada); recalculado quando o grid muda. */
  private components: Int32Array | null = null;
  private mainComponent = -1;

  constructor(public readonly w: number, public readonly h: number) {
    this.blocked = new Uint8Array(w * h);
  }

  /**
   * Rotula as regiões andáveis e guarda a maior (corredores + salas). Mobília
   * pode fechar bolsões pequenos (ex.: entre sofá, mesa de centro e luminária);
   * quem está num deles precisa sair para a região principal.
   */
  private ensureComponents(): Int32Array {
    if (this.components) return this.components;
    const comp = new Int32Array(this.w * this.h).fill(-1);
    const sizes: number[] = [];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const k = this.idx(x, y);
        if (comp[k] !== -1 || this.blocked[k] === 1) continue;
        const label = sizes.length;
        let size = 0;
        const stack = [k];
        comp[k] = label;
        while (stack.length) {
          const cur = stack.pop()!;
          size++;
          const cx = cur % this.w;
          const cy = Math.floor(cur / this.w);
          for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (!this.canMove(cx, cy, nx, ny)) continue;
            const nk = this.idx(nx, ny);
            if (comp[nk] !== -1) continue;
            comp[nk] = label;
            stack.push(nk);
          }
        }
        sizes.push(size);
      }
    }
    this.mainComponent = sizes.length ? sizes.indexOf(Math.max(...sizes)) : -1;
    this.components = comp;
    return comp;
  }

  private idx(x: number, y: number): number {
    return y * this.w + x;
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  blockCell(x: number, y: number): void {
    if (this.inside(x, y)) this.blocked[this.idx(x, y)] = 1;
    this.components = null;
  }

  isBlocked(x: number, y: number): boolean {
    return !this.inside(x, y) || this.blocked[this.idx(x, y)] === 1;
  }

  private edgeKey(x1: number, y1: number, x2: number, y2: number): string {
    return x1 + y1 * 1000 < x2 + y2 * 1000 ? `${x1},${y1}|${x2},${y2}` : `${x2},${y2}|${x1},${y1}`;
  }

  /** Bloqueia a passagem entre duas células vizinhas. */
  blockEdge(x1: number, y1: number, x2: number, y2: number): void {
    this.edges.add(this.edgeKey(x1, y1, x2, y2));
    this.components = null;
  }

  canMove(x1: number, y1: number, x2: number, y2: number): boolean {
    if (this.isBlocked(x2, y2)) return false;
    return !this.edges.has(this.edgeKey(x1, y1, x2, y2));
  }

  /**
   * Célula andável mais próxima (anéis crescentes), sempre na região principal:
   * uma célula livre dentro de um bolsão fechado por mobília não leva a lugar nenhum.
   */
  nearestWalkable(x: number, y: number): Vec2 {
    const comp = this.ensureComponents();
    const cx = Math.max(0, Math.min(this.w - 1, Math.floor(x)));
    const cy = Math.max(0, Math.min(this.h - 1, Math.floor(y)));
    const ok = (px: number, py: number): boolean => this.inside(px, py) && comp[this.idx(px, py)] === this.mainComponent;
    if (ok(cx, cy)) return { x: cx, y: cy };
    for (let r = 1; r < 12; r++) {
      let best: Vec2 | null = null;
      let bestD = Infinity;
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !ok(cx + dx, cy + dy)) continue;
          const d = Math.hypot(cx + dx + 0.5 - x, cy + dy + 0.5 - y);
          if (d < bestD) { bestD = d; best = { x: cx + dx, y: cy + dy }; }
        }
      }
      if (best) return best;
    }
    return { x: cx, y: cy };
  }

  /** A* em 4 direções. Retorna centros de tile (x + 0,5) do início ao fim, ou [] se não há caminho. */
  findPath(from: Vec2, to: Vec2): Vec2[] {
    const start = this.nearestWalkable(from.x, from.y);
    const goal = this.nearestWalkable(to.x, to.y);
    const key = (x: number, y: number): number => y * this.w + x;
    const open = new Map<number, { x: number; y: number; f: number; g: number }>();
    const came = new Map<number, number>();
    const gScore = new Map<number, number>();
    const hs = (x: number, y: number): number => Math.abs(x - goal.x) + Math.abs(y - goal.y);
    const sk = key(start.x, start.y);
    open.set(sk, { x: start.x, y: start.y, f: hs(start.x, start.y), g: 0 });
    gScore.set(sk, 0);
    const closed = new Set<number>();
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

    while (open.size > 0) {
      let bestKey = -1;
      let best: { x: number; y: number; f: number; g: number } | null = null;
      for (const [k, n] of open) {
        if (!best || n.f < best.f) { best = n; bestKey = k; }
      }
      if (!best) break;
      open.delete(bestKey);
      if (best.x === goal.x && best.y === goal.y) {
        const path: Vec2[] = [];
        let k = bestKey;
        while (k !== undefined) {
          path.push({ x: (k % this.w) + 0.5, y: Math.floor(k / this.w) + 0.5 });
          const prev = came.get(k);
          if (prev === undefined) break;
          k = prev;
        }
        path.reverse();
        return path;
      }
      closed.add(bestKey);
      for (const [dx, dy] of dirs) {
        const nx = best.x + dx;
        const ny = best.y + dy;
        if (!this.canMove(best.x, best.y, nx, ny)) continue;
        const nk = key(nx, ny);
        if (closed.has(nk)) continue;
        const tentative = best.g + 1;
        if (tentative < (gScore.get(nk) ?? Infinity)) {
          came.set(nk, bestKey);
          gScore.set(nk, tentative);
          open.set(nk, { x: nx, y: ny, g: tentative, f: tentative + hs(nx, ny) });
        }
      }
    }
    return [];
  }
}

/** Remove pontos colineares para o agente andar em linha reta nos corredores. */
export function simplifyPath(path: Vec2[]): Vec2[] {
  if (path.length < 3) return path;
  const out: Vec2[] = [path[0]!];
  for (let i = 1; i < path.length - 1; i++) {
    const a = out[out.length - 1]!;
    const b = path[i]!;
    const c = path[i + 1]!;
    const collinear = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) === 0;
    if (!collinear) out.push(b);
  }
  out.push(path[path.length - 1]!);
  return out;
}
