import { Container, Graphics } from "pixi.js";
import { TILE_H, TILE_W, Z_UNIT, toScreen, type Vec2 } from "./projection";
import { PALETTE, STATUS_COLORS, shade } from "./palette";
import type { OfficeAgentStatus } from "@/lib/office/types";

export interface ActorLook {
  shirt: number;
  hair: number;
  skin: number;
  /** Avatar humano: tag laranja e anel fixo no chão. */
  isUser?: boolean;
}

const WALK_SPEED = 2.4; // tiles por segundo
const SEATED_Z = 0.46;

/**
 * Personagem isométrico "de frente para a câmera" (como no Gather): corpo em
 * retângulos arredondados, balão de estado sobre a cabeça, anéis no chão.
 * A posição de mundo (`wx`, `wy`) é o centro dos pés.
 */
export class AgentActor extends Container {
  wx = 0;
  wy = 0;
  seated = false;
  status: OfficeAgentStatus = "idle";
  selected = false;
  hovered = false;
  showDoc = false;

  /** Efeitos desenhados atrás do ator (coluna de luz + anéis). Fica na camada de objetos com profundidade menor. */
  readonly fx = new Graphics();
  /** Anel de seleção e sombra, no chão. */
  readonly ground = new Graphics();

  private readonly body = new Graphics();
  private readonly bubble = new Graphics();
  private readonly doc = new Graphics();
  private path: Vec2[] = [];
  private onArrive: (() => void) | null = null;
  private t = Math.random() * 10;
  private facing: 1 | -1 = 1;
  private walkPhase = 0;

  constructor(public readonly id: string, public look: ActorLook) {
    super();
    this.addChild(this.body);
    this.addChild(this.doc);
    this.addChild(this.bubble);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.redraw();
  }

  get depth(): number {
    return this.wx + this.wy + 0.6;
  }

  get walking(): boolean {
    return this.path.length > 0;
  }

  /** Coloca o ator numa posição, sem animar. */
  place(x: number, y: number, seated: boolean): void {
    this.wx = x;
    this.wy = y;
    this.seated = seated;
    this.path = [];
    this.onArrive = null;
    this.syncPosition();
    this.redraw();
  }

  setStatus(status: OfficeAgentStatus): void {
    if (status === this.status) return;
    this.status = status;
    this.redraw();
  }

  setSelected(v: boolean): void {
    if (v === this.selected) return;
    this.selected = v;
    this.redrawGround();
  }

  setHovered(v: boolean): void {
    if (v === this.hovered) return;
    this.hovered = v;
    this.redrawGround();
  }

  setDoc(v: boolean): void {
    if (v === this.showDoc) return;
    this.showDoc = v;
    this.redrawDoc();
  }

  /** Levanta (se sentado) e anda pelo caminho; chama `onArrive` no fim. */
  walk(path: Vec2[], onArrive?: () => void): void {
    if (path.length === 0) { onArrive?.(); return; }
    this.seated = false;
    this.path = path.slice();
    this.onArrive = onArrive ?? null;
    this.redraw();
  }

  sit(x: number, y: number): void {
    this.place(x, y, true);
  }

  /** Avança a animação. `dt` em segundos. */
  update(dt: number): void {
    this.t += dt;
    if (this.path.length > 0) {
      const target = this.path[0]!;
      const dx = target.x - this.wx;
      const dy = target.y - this.wy;
      const dist = Math.hypot(dx, dy);
      const step = WALK_SPEED * dt;
      if (dist <= step) {
        this.wx = target.x;
        this.wy = target.y;
        this.path.shift();
        if (this.path.length === 0) {
          const cb = this.onArrive;
          this.onArrive = null;
          this.walkPhase = 0;
          this.redraw();
          cb?.();
        }
      } else {
        this.wx += (dx / dist) * step;
        this.wy += (dy / dist) * step;
        const sx = dx - dy; // direção na tela
        if (Math.abs(sx) > 0.05) this.facing = sx > 0 ? 1 : -1;
        this.walkPhase += dt * 11;
      }
    }
    this.syncPosition();
    // respiração / bob
    let bob = 0;
    if (this.walking) bob = Math.abs(Math.sin(this.walkPhase)) * -2.2;
    else if (this.status === "working") bob = Math.sin(this.t * 3) * 0.8;
    else if (this.status === "checkpoint") bob = Math.sin(this.t * 1.5) * 0.6;
    this.body.y = bob;
    this.doc.y = bob;
    this.body.scale.x = this.facing;
    this.doc.scale.x = this.facing;
    this.bubble.y = Math.sin(this.t * 2) * 1.6;
    if (this.status === "checkpoint" || this.status === "delivering") {
      const pulse = 0.85 + Math.sin(this.t * 4) * 0.15;
      this.bubble.scale.set(pulse);
      this.fx.alpha = 0.7 + Math.sin(this.t * 3) * 0.25;
    } else {
      this.bubble.scale.set(1);
      this.fx.alpha = 1;
    }
  }

  private syncPosition(): void {
    const p = toScreen(this.wx, this.wy, this.seated ? SEATED_Z : 0);
    this.position.set(p.x, p.y);
    const g = toScreen(this.wx, this.wy, 0);
    this.ground.position.set(g.x, g.y);
    this.fx.position.set(g.x, g.y);
  }

  private redraw(): void {
    this.redrawBody();
    this.redrawBubble();
    this.redrawDoc();
    this.redrawGround();
    this.redrawFx();
  }

  private redrawBody(): void {
    const g = this.body;
    g.clear();
    const { shirt, hair, skin } = this.look;
    const cx = 0;
    const cy = 0;
    if (!this.seated) {
      // pernas + sapatos
      g.roundRect(cx - 6.5, cy - 11, 5, 11, 2).fill(0x2b2825);
      g.roundRect(cx + 1.5, cy - 11, 5, 11, 2).fill(0x2b2825);
      g.roundRect(cx - 7, cy - 3, 6, 3, 1.5).fill(PALETTE.graphite);
      g.roundRect(cx + 1, cy - 3, 6, 3, 1.5).fill(PALETTE.graphite);
    }
    const ty = this.seated ? cy - 22 : cy - 25;
    // braços
    g.roundRect(cx - 12.5, ty + 2, 4.5, 12, 2.2).fill(shade(shirt, 0.82));
    g.roundRect(cx + 8, ty + 2, 4.5, 12, 2.2).fill(shade(shirt, 0.82));
    // tronco
    g.roundRect(cx - 9, ty, 18, 16, 4.5).fill(shirt);
    g.roundRect(cx + 2.5, ty, 6.5, 16, 3).fill({ color: PALETTE.graphite, alpha: 0.14 });
    g.ellipse(cx - 4, ty + 4, 3.5, 2).fill({ color: 0xffffff, alpha: 0.22 });
    // pescoço + cabeça
    g.rect(cx - 2.5, ty - 3, 5, 4).fill(shade(skin, 0.85));
    const hy = ty - 16;
    g.roundRect(cx - 7.5, hy, 15, 14.5, 5.5).fill(skin);
    g.roundRect(cx + 2.5, hy, 5, 14.5, 3).fill({ color: PALETTE.graphite, alpha: 0.1 });
    g.roundRect(cx - 8, hy - 1.5, 16, 7, 5).fill(hair);
    g.roundRect(cx - 8, hy + 3, 3.2, 6, 1.5).fill(hair);
    g.circle(cx - 3, hy + 8.5, 1.2).fill(PALETTE.graphite);
    g.circle(cx + 3, hy + 8.5, 1.2).fill(PALETTE.graphite);
    g.ellipse(cx - 5, hy + 11, 1.8, 1).fill({ color: 0xe88a7a, alpha: 0.5 });
  }

  private redrawBubble(): void {
    const g = this.bubble;
    g.clear();
    const ty = this.seated ? -22 : -25;
    const by = ty - 16 - 12;
    const col = STATUS_COLORS[this.status];
    switch (this.status) {
      case "working":
        g.circle(0, by, 8).fill(col);
        g.circle(-4, by, 1.5).fill(0xffffff);
        g.circle(0, by, 1.5).fill(0xffffff);
        g.circle(4, by, 1.5).fill(0xffffff);
        break;
      case "checkpoint":
        g.circle(0, by, 12).fill({ color: PALETTE.accent, alpha: 0.28 });
        g.circle(0, by, 9).fill(PALETTE.accent);
        g.roundRect(-1.4, by - 5.5, 2.8, 7, 1.2).fill(PALETTE.graphite);
        g.circle(0, by + 4.2, 1.6).fill(PALETTE.graphite);
        break;
      case "delivering":
        g.circle(0, by, 8).fill(col);
        g.moveTo(-4, by).lineTo(4, by).moveTo(1, by - 3).lineTo(4, by).lineTo(1, by + 3).stroke({ width: 1.8, color: 0xffffff, cap: "round", join: "round" });
        break;
      case "done":
        g.circle(0, by, 8).fill(col);
        g.moveTo(-4, by).lineTo(-1, by + 3).lineTo(4.5, by - 3).stroke({ width: 2, color: 0xffffff, cap: "round", join: "round" });
        break;
      default:
        break;
    }
    if (this.look.isUser) {
      g.clear();
    }
  }

  private redrawDoc(): void {
    const g = this.doc;
    g.clear();
    if (!this.showDoc) return;
    const ty = this.seated ? -22 : -25;
    const x = 7;
    const y = ty + 4;
    g.roundRect(x, y, 11, 14, 1.5).fill(PALETTE.paperWhite).stroke({ width: 0.8, color: 0x8f8c84 });
    g.rect(x + 2, y + 3, 7, 1.2).fill(STATUS_COLORS.delivering);
    g.rect(x + 2, y + 6, 7, 1.2).fill(0xbdb7ab);
    g.rect(x + 2, y + 9, 5, 1.2).fill(0xbdb7ab);
  }

  private redrawGround(): void {
    const g = this.ground;
    g.clear();
    if (!this.seated) g.ellipse(0, 0, 0.28 * TILE_W * 0.6, 0.28 * TILE_H * 0.6).fill({ color: PALETTE.graphite, alpha: 0.28 });
    if (this.look.isUser) {
      g.ellipse(0, 0, 0.42 * TILE_W, 0.42 * TILE_H).stroke({ width: 2, color: PALETTE.accent });
    }
    if (this.selected) {
      g.ellipse(0, 0, 0.62 * TILE_W, 0.62 * TILE_H).fill({ color: PALETTE.accent, alpha: 0.16 });
      // anel tracejado
      const rx = 0.45 * TILE_W;
      const ry = 0.45 * TILE_H;
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = a0 + (Math.PI * 2) / n * 0.6;
        g.moveTo(Math.cos(a0) * rx, Math.sin(a0) * ry);
        for (let k = 1; k <= 4; k++) {
          const a = a0 + ((a1 - a0) * k) / 4;
          g.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
        }
      }
      g.stroke({ width: 2, color: PALETTE.accent, cap: "round" });
    } else if (this.hovered) {
      g.ellipse(0, 0, 0.5 * TILE_W, 0.5 * TILE_H).stroke({ width: 1.5, color: PALETTE.accent, alpha: 0.6 });
    }
  }

  private redrawFx(): void {
    const g = this.fx;
    g.clear();
    if (this.status !== "checkpoint") return;
    const cy = 0.55 * TILE_H; // anéis um pouco à frente da mesa
    g.ellipse(0, cy, 1.1 * TILE_W, 1.1 * TILE_H).stroke({ width: 1.5, color: PALETTE.accent, alpha: 0.5 });
    g.ellipse(0, cy, 0.75 * TILE_W, 0.75 * TILE_H).stroke({ width: 1.5, color: PALETTE.accent, alpha: 0.8 });
    // coluna de luz em faixas (mais opaca embaixo)
    const hw = 0.7 * TILE_W;
    const top = -5.2 * Z_UNIT;
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const y0 = cy + (top * i) / steps;
      const y1 = cy + (top * (i + 1)) / steps;
      const alpha = 0.32 * (1 - i / steps);
      g.rect(-hw, y1, hw * 2, y0 - y1).fill({ color: PALETTE.accent, alpha });
    }
  }
}
