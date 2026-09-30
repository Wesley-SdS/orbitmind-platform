import { Container, Graphics } from "pixi.js";
import { TILE_H, TILE_W, Z_UNIT, poly, toScreen } from "./projection";
import { PALETTE, SPINE_COLORS, STATUS_COLORS, shade } from "./palette";
import { drawBox, drawCylinder, drawEllipseShadow, drawShadow, faceN, faceW, flat } from "./draw";
import type { FurnitureSpec } from "@/lib/office/room-layout";
import type { OfficeAgentStatus } from "@/lib/office/types";

export interface Layers {
  /** Chão (tapetes, capachos). */
  ground: Graphics;
  /** Sombras (camada com blur). */
  shadows: Graphics;
  /** Luz (manchas claras, camada com blur). */
  lights: Graphics;
  /** Objetos ordenados por profundidade. */
  add: (display: Container, depth: number) => void;
}

/** Mesa com gaveteiro, monitor de costas para a câmera e cadeira. O brilho do monitor acompanha o estado. */
export class DeskActor {
  readonly container = new Container();
  private readonly glow = new Graphics();
  private readonly rim = new Graphics();
  private status: OfficeAgentStatus | "off" = "off";

  constructor(private readonly x: number, private readonly y: number) {
    const g = new Graphics();
    drawBox(g, x + 0.06, y + 0.06, 0, 0.06, 0.06, 0.64, PALETTE.dark);
    drawBox(g, x + 0.06, y + 0.68, 0, 0.06, 0.06, 0.64, PALETTE.dark);
    drawBox(g, x + 1.05, y + 0.08, 0, 0.5, 0.64, 0.64, PALETTE.woodDark);
    drawBox(g, x, y, 0.64, 1.6, 0.8, 0.09, PALETTE.wood, { top: PALETTE.woodTop });
    this.container.addChild(g);
    this.container.addChild(this.glow);
    const m = new Graphics();
    drawBox(m, x + 0.66, y + 0.5, 0.73, 0.14, 0.14, 0.04, PALETTE.dark);
    drawBox(m, x + 0.7, y + 0.55, 0.77, 0.06, 0.06, 0.22, PALETTE.dark);
    drawBox(m, x + 0.4, y + 0.56, 0.92, 0.66, 0.05, 0.42, PALETTE.darker, { top: 0x57534c, left: PALETTE.darker, right: PALETTE.darkest });
    drawBox(m, x + 0.5, y + 0.2, 0.73, 0.5, 0.18, 0.03, PALETTE.keyboard);
    drawBox(m, x + 1.28, y + 0.22, 0.73, 0.14, 0.14, 0.14, PALETTE.mug, { top: 0xffffff });
    this.container.addChild(m);
    this.container.addChild(this.rim);
    this.setStatus("off");
  }

  get depth(): number {
    return this.x + 1.6 + this.y + 0.8;
  }

  setStatus(status: OfficeAgentStatus | "off"): void {
    if (status === this.status) return;
    this.status = status;
    this.glow.clear();
    this.rim.clear();
    const color = status === "off" || status === "idle" ? null : STATUS_COLORS[status];
    if (color === null) return;
    const c = toScreen(this.x + 0.72, this.y + 0.28, 0.73);
    this.glow.ellipse(c.x, c.y, 0.55 * TILE_W, 0.55 * TILE_H).fill({ color, alpha: 0.32 });
    const a = toScreen(this.x + 0.4, this.y + 0.61, 1.34);
    const b = toScreen(this.x + 1.06, this.y + 0.61, 1.34);
    this.rim.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 2.2, color, alpha: 0.95, cap: "round" });
  }
}

export function buildChair(L: Layers, x: number, y: number, color: number = PALETTE.chair): void {
  drawEllipseShadow(L.shadows, x + 0.25, y + 0.25, 0.3, 0.18);
  const base = new Graphics();
  const c = toScreen(x + 0.25, y + 0.25);
  base.ellipse(c.x, c.y, 0.3 * TILE_W, 0.3 * TILE_H).fill(PALETTE.dark);
  L.add(base, x + y + 0.2);
  const g = new Graphics();
  drawBox(g, x + 0.21, y + 0.21, 0, 0.08, 0.08, 0.42, 0x57534c);
  drawBox(g, x, y + 0.02, 0.42, 0.5, 0.48, 0.1, color);
  drawBox(g, x, y, 0.5, 0.5, 0.08, 0.5, color);
  L.add(g, x + 0.5 + y + 0.5);
}

export function buildPlant(L: Layers, x: number, y: number, size = 1): void {
  const r = 0.18 * size;
  drawEllipseShadow(L.shadows, x + r, y + r, r * 1.4, 0.2);
  const g = new Graphics();
  drawBox(g, x, y, 0, r * 2, r * 2, 0.36 * size, PALETTE.plantPot, { top: PALETTE.plantPotTop });
  const c = toScreen(x + r, y + r, 0.36 * size);
  const k = size;
  g.circle(c.x - 6 * k, c.y - 10 * k, 9 * k).fill(PALETTE.leaf1);
  g.circle(c.x + 6 * k, c.y - 12 * k, 9 * k).fill(PALETTE.leaf2);
  g.circle(c.x, c.y - 18 * k, 9 * k).fill(PALETTE.leaf3);
  g.circle(c.x - 3 * k, c.y - 20 * k, 3.5 * k).fill({ color: PALETTE.leafHi, alpha: 0.8 });
  L.add(g, x + y + r * 2 + 0.05);
}

export function buildBookshelf(L: Layers, x: number, y: number, alongY = true): void {
  const w = alongY ? 0.42 : 1.4;
  const d = alongY ? 1.4 : 0.42;
  const h = 1.7;
  drawShadow(L.shadows, x, y, w, d, 0.22);
  const g = new Graphics();
  drawBox(g, x, y, 0, w, d, h, PALETTE.shelf);
  for (const lvl of [0.02, 0.58, 1.14]) {
    const shelf = alongY
      ? poly([[x + w, y, lvl], [x + w, y + d, lvl], [x + w, y + d, lvl + 0.05], [x + w, y, lvl + 0.05]])
      : poly([[x, y + d, lvl], [x + w, y + d, lvl], [x + w, y + d, lvl + 0.05], [x, y + d, lvl + 0.05]]);
    g.poly(shelf).fill(PALETTE.shelfPlank);
    let a = 0.1;
    let i = 0;
    const span = alongY ? d : w;
    while (a < span - 0.2) {
      const bw = 0.11 + (i % 3) * 0.03;
      const bh = 0.34 + (i % 2) * 0.08;
      const q = alongY
        ? poly([[x + w, y + a, lvl + 0.05], [x + w, y + a + bw, lvl + 0.05], [x + w, y + a + bw, lvl + 0.05 + bh], [x + w, y + a, lvl + 0.05 + bh]])
        : poly([[x + a, y + d, lvl + 0.05], [x + a + bw, y + d, lvl + 0.05], [x + a + bw, y + d, lvl + 0.05 + bh], [x + a, y + d, lvl + 0.05 + bh]]);
      g.poly(q).fill(SPINE_COLORS[(i + Math.round(lvl * 10)) % SPINE_COLORS.length]!);
      a += bw + 0.03;
      i++;
    }
  }
  L.add(g, x + w + y + d + 0.01);
}

export function buildSofa(L: Layers, x: number, y: number, w = 1.8, color: number = PALETTE.sofa): void {
  drawShadow(L.shadows, x, y, w, 0.85, 0.22);
  const g = new Graphics();
  drawBox(g, x, y + 0.1, 0, w, 0.75, 0.42, color);
  drawBox(g, x, y, 0.3, w, 0.22, 0.5, color, { top: shade(color, 1.2) });
  drawBox(g, x, y, 0.42, 0.18, 0.85, 0.22, color, { top: shade(color, 1.2) });
  drawBox(g, x + w - 0.18, y, 0.42, 0.18, 0.85, 0.22, color, { top: shade(color, 1.2) });
  const n = Math.round(w / 0.6);
  for (let i = 1; i < n; i++) {
    const u = x + (w / n) * i;
    const a = toScreen(u, y + 0.22, 0.42);
    const b = toScreen(u, y + 0.85, 0.42);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1, color: shade(color, 0.75) });
  }
  L.add(g, x + w + y + 0.86);
}

export function buildCounter(L: Layers, x: number, y: number, w: number, d: number, h: number, color: number = PALETTE.dark): void {
  drawShadow(L.shadows, x, y, w, d, 0.24);
  const g = new Graphics();
  drawBox(g, x, y, 0, w, d, h, color, { top: PALETTE.woodTop });
  L.add(g, x + w + y + d);
}

export function buildCoffeeMachine(L: Layers, x: number, y: number, z: number): void {
  const g = new Graphics();
  drawBox(g, x, y, z, 0.38, 0.36, 0.55, PALETTE.darker, { top: 0x57534c });
  const c = toScreen(x + 0.19, y + 0.36, z + 0.35);
  g.circle(c.x, c.y, 2.4).fill(PALETTE.accent);
  g.circle(c.x, c.y, 4).fill({ color: PALETTE.accent, alpha: 0.3 });
  drawBox(g, x + 0.5, y + 0.05, z, 0.14, 0.14, 0.14, PALETTE.ghost);
  drawBox(g, x + 0.68, y + 0.05, z, 0.14, 0.14, 0.14, PALETTE.ghost);
  drawBox(g, x + 0.5, y + 0.22, z, 0.14, 0.14, 0.14, PALETTE.ghost);
  L.add(g, x + y + 0.8);
}

export function buildWaterCooler(L: Layers, x: number, y: number): void {
  drawEllipseShadow(L.shadows, x + 0.18, y + 0.18, 0.25, 0.2);
  const g = new Graphics();
  drawBox(g, x, y, 0, 0.36, 0.36, 0.95, PALETTE.cooler);
  drawCylinder(g, x + 0.18, y + 0.18, 0.95, 0.15, 0.42, PALETTE.waterBottle, PALETTE.waterBottleTop);
  L.add(g, x + 0.36 + y + 0.36 + 0.3);
}

export function buildPrinter(L: Layers, x: number, y: number): void {
  drawShadow(L.shadows, x, y, 0.75, 0.6, 0.2);
  const g = new Graphics();
  drawBox(g, x, y, 0, 0.75, 0.6, 0.42, PALETTE.printer);
  drawBox(g, x + 0.12, y + 0.1, 0.42, 0.5, 0.35, 0.1, PALETTE.printerDark);
  drawBox(g, x + 0.08, y + 0.44, 0.42, 0.6, 0.03, 0.03, 0x2f6fd6);
  L.add(g, x + 0.75 + y + 0.6);
}

export function buildPackages(L: Layers, x: number, y: number): void {
  drawShadow(L.shadows, x, y, 0.7, 0.7, 0.2);
  const g = new Graphics();
  drawBox(g, x, y, 0, 0.7, 0.7, 0.5, PALETTE.box);
  drawBox(g, x + 0.12, y + 0.1, 0.5, 0.45, 0.45, 0.38, PALETTE.boxLight);
  const a = toScreen(x + 0.35, y + 0.7, 0);
  const b = toScreen(x + 0.35, y + 0.7, 0.5);
  g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1.5, color: PALETTE.woodDark });
  L.add(g, x + 0.7 + y + 0.7 + 0.2);
}

export function buildCabinet(L: Layers, x: number, y: number): void {
  drawShadow(L.shadows, x, y, 0.5, 1.2, 0.2);
  const g = new Graphics();
  drawBox(g, x, y, 0, 0.5, 1.2, 1.3, PALETTE.cabinet);
  for (const lv of [0.35, 0.7, 1.05]) {
    const a = toScreen(x + 0.5, y + 0.05, lv);
    const b = toScreen(x + 0.5, y + 1.15, lv);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1, color: PALETTE.cabinetLine });
  }
  const colors = [0x2f6fd6, 0xf2541b, 0x2e8b57, 0x8f8c84];
  for (let i = 0; i < 4; i++) {
    g.poly(poly([[x + 0.5, y + 0.15 + i * 0.26, 0.1], [x + 0.5, y + 0.33 + i * 0.26, 0.1], [x + 0.5, y + 0.33 + i * 0.26, 0.28], [x + 0.5, y + 0.15 + i * 0.26, 0.28]])).fill(colors[i]!);
  }
  L.add(g, x + 0.5 + y + 1.2 + 0.02);
}

export function buildLamp(L: Layers, x: number, y: number): void {
  drawEllipseShadow(L.shadows, x + 0.1, y + 0.1, 0.25, 0.15);
  const c = toScreen(x + 0.1, y + 0.1);
  L.lights.ellipse(c.x, c.y, 0.9 * TILE_W, 0.9 * TILE_H).fill({ color: PALETTE.lampLight, alpha: 0.2 });
  const g = new Graphics();
  drawBox(g, x + 0.06, y + 0.06, 0, 0.08, 0.08, 1.5, PALETTE.dark);
  drawCylinder(g, x + 0.1, y + 0.1, 1.5, 0.26, 0.3, PALETTE.lampShade, PALETTE.lampShadeTop);
  L.add(g, x + y + 0.2 + 0.4);
}

export function buildMeetingTable(L: Layers, x: number, y: number, r: number): void {
  drawEllipseShadow(L.shadows, x, y, r * 1.1, 0.22);
  const g = new Graphics();
  drawCylinder(g, x, y, 0, 0.12, 0.72, PALETTE.dark, 0x57534c);
  drawCylinder(g, x, y, 0.72, r, 0.08, PALETTE.wood, PALETTE.woodTop);
  L.add(g, x + y + r * 2 + 0.6);
}

export function buildCoffeeTable(L: Layers, x: number, y: number): void {
  drawShadow(L.shadows, x, y, 0.9, 0.55, 0.18);
  const g = new Graphics();
  drawBox(g, x, y, 0, 0.9, 0.55, 0.32, 0x4a3a2c, { top: 0x6b5541 });
  drawBox(g, x + 0.3, y + 0.15, 0.32, 0.14, 0.14, 0.12, PALETTE.ghost);
  L.add(g, x + 0.9 + y + 0.55);
}

interface Stroke { pts: Array<[number, number]>; color: number; w?: number; fill?: boolean }

const BOARD_STROKES: Record<"chart" | "mood" | "check" | "calendar" | "plan", Stroke[]> = {
  chart: [
    { pts: [[0.1, 0.75], [0.3, 0.45], [0.5, 0.6], [0.7, 0.25], [0.9, 0.4]], color: 0x2f6fd6, w: 1.6 },
    { pts: [[0.1, 0.2], [0.55, 0.2]], color: 0x1a1a17, w: 1.4 },
    { pts: [[0.1, 0.12], [0.4, 0.12]], color: 0x1a1a17, w: 1.4 },
  ],
  mood: [
    { pts: [[0.08, 0.6], [0.28, 0.6], [0.28, 0.92], [0.08, 0.92]], color: 0xf2541b, fill: true },
    { pts: [[0.36, 0.55], [0.56, 0.55], [0.56, 0.9], [0.36, 0.9]], color: 0x2f6fd6, fill: true },
    { pts: [[0.64, 0.6], [0.84, 0.6], [0.84, 0.92], [0.64, 0.92]], color: 0xe0457b, fill: true },
    { pts: [[0.1, 0.35], [0.9, 0.35]], color: 0x1a1a17, w: 1.4 },
    { pts: [[0.1, 0.22], [0.6, 0.22]], color: 0x8f8c84, w: 1.4 },
  ],
  check: [
    { pts: [[0.12, 0.8], [0.22, 0.7], [0.32, 0.86]], color: 0x2e8b57, w: 1.8 }, { pts: [[0.4, 0.78], [0.9, 0.78]], color: 0x1a1a17, w: 1.4 },
    { pts: [[0.12, 0.55], [0.22, 0.45], [0.32, 0.61]], color: 0x2e8b57, w: 1.8 }, { pts: [[0.4, 0.53], [0.9, 0.53]], color: 0x1a1a17, w: 1.4 },
    { pts: [[0.12, 0.22], [0.32, 0.36]], color: 0xf2541b, w: 1.8 }, { pts: [[0.12, 0.36], [0.32, 0.22]], color: 0xf2541b, w: 1.8 }, { pts: [[0.4, 0.28], [0.8, 0.28]], color: 0x1a1a17, w: 1.4 },
  ],
  calendar: [
    { pts: [[0.05, 0.75], [0.95, 0.75]], color: 0x8f8c84, w: 1 }, { pts: [[0.05, 0.5], [0.95, 0.5]], color: 0x8f8c84, w: 1 }, { pts: [[0.05, 0.25], [0.95, 0.25]], color: 0x8f8c84, w: 1 },
    { pts: [[0.25, 0.05], [0.25, 0.95]], color: 0x8f8c84, w: 1 }, { pts: [[0.5, 0.05], [0.5, 0.95]], color: 0x8f8c84, w: 1 }, { pts: [[0.75, 0.05], [0.75, 0.95]], color: 0x8f8c84, w: 1 },
    { pts: [[0.08, 0.62], [0.2, 0.62]], color: 0x2e8b57, w: 2.2 }, { pts: [[0.55, 0.38], [0.7, 0.38]], color: 0xf2541b, w: 2.2 }, { pts: [[0.3, 0.88], [0.45, 0.88]], color: 0x2f6fd6, w: 2.2 },
  ],
  plan: [
    { pts: [[0.1, 0.2], [0.1, 0.85]], color: 0x1a1a17, w: 1.4 }, { pts: [[0.1, 0.2], [0.9, 0.2]], color: 0x1a1a17, w: 1.4 },
    { pts: [[0.2, 0.3], [0.35, 0.5], [0.5, 0.42], [0.65, 0.7], [0.85, 0.8]], color: 0x0b8fa8, w: 1.8 },
    { pts: [[0.2, 0.28], [0.85, 0.5]], color: 0xf2541b, w: 1.4 },
  ],
};

export function buildWhiteboard(L: Layers, x: number, yf: number, len: number, z: number, h: number, variant: keyof typeof BOARD_STROKES): void {
  const F = faceN(yf);
  const g = new Graphics();
  g.poly(flat([F(x, z), F(x + len, z), F(x + len, z + h), F(x, z + h)])).fill(PALETTE.whiteboard).stroke({ width: 1.2, color: PALETTE.whiteboardFrame, join: "round" });
  for (const st of BOARD_STROKES[variant]) {
    const p = st.pts.map(([u, v]) => F(x + u * len, z + v * h));
    g.poly(flat(p), st.fill ?? false);
    if (st.fill) g.fill(st.color);
    else g.stroke({ width: st.w ?? 1.6, color: st.color, cap: "round", join: "round" });
  }
  L.add(g, x + len + yf + 0.3);
}

export function buildWindow(L: Layers, x: number, f: number, len: number, z: number, h: number, alongX: boolean): void {
  const F = alongX ? faceN(f) : faceW(f);
  const g = new Graphics();
  // vidro em três faixas (céu mais claro em cima)
  const bands: Array<[number, number, number]> = [[0, 0.45, PALETTE.window3], [0.45, 0.75, PALETTE.window2], [0.75, 1, PALETTE.window1]];
  for (const [a, b, color] of bands) {
    g.poly(flat([F(x, z + h * a), F(x + len, z + h * a), F(x + len, z + h * b), F(x, z + h * b)])).fill(color);
  }
  g.poly(flat([F(x, z), F(x + len, z), F(x + len, z + h), F(x, z + h)])).stroke({ width: 1.5, color: PALETTE.windowFrame });
  const m1 = F(x + len / 2, z);
  const m2 = F(x + len / 2, z + h);
  const m3 = F(x, z + h * 0.55);
  const m4 = F(x + len, z + h * 0.55);
  g.moveTo(m1.x, m1.y).lineTo(m2.x, m2.y).moveTo(m3.x, m3.y).lineTo(m4.x, m4.y).stroke({ width: 1.2, color: PALETTE.windowFrame });
  L.add(g, x + len + f + 0.2);
  // luz no chão
  const patch = alongX
    ? poly([[x + 0.4, f + 0.3], [x + len + 0.4, f + 0.3], [x + len + 1.4, f + 2.4], [x + 0.4, f + 2.4]])
    : poly([[f + 0.3, x + 0.4], [f + 0.3, x + len + 0.4], [f + 2.4, x + len + 1.4], [f + 2.4, x + 0.4]]);
  L.lights.poly(patch).fill({ color: 0xffffff, alpha: 0.16 });
}

export function buildWallScreen(L: Layers, x: number, yf: number, len: number, z: number, h: number): void {
  const F = faceN(yf);
  const g = new Graphics();
  g.poly(flat([F(x, z), F(x + len, z), F(x + len, z + h), F(x, z + h)])).fill(PALETTE.screenDark).stroke({ width: 1.5, color: PALETTE.screenFrame });
  const bars: Array<[number, number]> = [[0.5, 0x2f6fd6], [0.8, 0x2f6fd6], [0.35, 0xf2541b], [0.9, 0x2e8b57], [0.6, 0x2e8b57]];
  bars.forEach(([v, c], i) => {
    const u0 = 0.1 + i * 0.16;
    const u1 = u0 + 0.1;
    g.poly(flat([F(x + u0 * len, z + 0.12 * h), F(x + u1 * len, z + 0.12 * h), F(x + u1 * len, z + (0.12 + v * 0.75) * h), F(x + u0 * len, z + (0.12 + v * 0.75) * h)])).fill(c);
  });
  g.poly(flat([F(x + 0.06 * len, z + 0.92 * h), F(x + 0.5 * len, z + 0.92 * h), F(x + 0.5 * len, z + 0.86 * h), F(x + 0.06 * len, z + 0.86 * h)])).fill({ color: PALETTE.ghost, alpha: 0.6 });
  L.add(g, x + len + yf + 0.3);
}

export function buildOrbitMark(L: Layers, x: number, yf: number, z: number, r: number): void {
  const F = faceN(yf);
  const g = new Graphics();
  const circle: number[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const p = F(x + Math.cos(a) * r * 0.36, z + Math.sin(a) * r * 0.36);
    circle.push(p.x, p.y);
  }
  g.poly(circle).fill(PALETTE.accent);
  const rot = (-28 * Math.PI) / 180;
  const ring: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const ex = Math.cos(a) * r;
    const ey = Math.sin(a) * r * 0.46;
    ring.push(F(x + ex * Math.cos(rot) - ey * Math.sin(rot), z + ex * Math.sin(rot) + ey * Math.cos(rot)));
  }
  g.poly(flat(ring), false).stroke({ width: 1.6, color: PALETTE.ghost });
  const dot = F(x + r * 0.78, z + r * 0.42);
  g.circle(dot.x, dot.y, 2.2).fill(PALETTE.ghost);
  L.add(g, x + yf + 0.5);
}

/** Constrói uma peça a partir da especificação da planta. */
export function buildFurniture(L: Layers, f: FurnitureSpec): void {
  switch (f.type) {
    case "chair": buildChair(L, f.x, f.y); break;
    case "plant": buildPlant(L, f.x, f.y, f.size); break;
    case "bookshelf": buildBookshelf(L, f.x, f.y, f.alongY ?? true); break;
    case "sofa": buildSofa(L, f.x, f.y, f.w); break;
    case "rug": break; // desenhado na camada de chão pelo scene
    case "counter": buildCounter(L, f.x, f.y, f.w, f.d, f.h, f.color); break;
    case "coffee": buildCoffeeMachine(L, f.x, f.y, f.z); break;
    case "cooler": buildWaterCooler(L, f.x, f.y); break;
    case "printer": buildPrinter(L, f.x, f.y); break;
    case "packages": buildPackages(L, f.x, f.y); break;
    case "cabinet": buildCabinet(L, f.x, f.y); break;
    case "lamp": buildLamp(L, f.x, f.y); break;
    case "table": buildMeetingTable(L, f.x, f.y, f.r); break;
    case "coffeeTable": buildCoffeeTable(L, f.x, f.y); break;
    case "whiteboard": buildWhiteboard(L, f.x, f.yf, f.len, f.z, f.h, f.variant); break;
    case "window": buildWindow(L, f.x, f.f, f.len, f.z, f.h, f.alongX); break;
    case "screen": buildWallScreen(L, f.x, f.yf, f.len, f.z, f.h); break;
    case "orbitMark": buildOrbitMark(L, f.x, f.yf, f.z, f.r); break;
  }
}

export const Z = Z_UNIT;
