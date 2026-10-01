import { Container, Graphics } from "pixi.js";
import { TILE_H, TILE_W, Z_UNIT, toScreen, type Vec2 } from "./projection";
import { PALETTE, STATUS_COLORS, shade } from "./palette";
import type { AvatarLook, OfficeAgentStatus } from "@/lib/office/types";

export type ActorLook = AvatarLook;

const WALK_SPEED = 2.4; // tiles por segundo
const SEATED_Z = 0.46;
/** Tempo para levantar da cadeira ou sentar (s). */
const SEAT_TRANSITION_S = 0.24;
/** Arranque até a velocidade de cruzeiro (s) e distância em que começa a frear (tiles). */
const ACCEL_S = 0.25;
const BRAKE_TILES = 0.5;
const LEG_LEN = 11;
const ARM_LEN = 12;

/**
 * Personagem isométrico de frente para a câmera (como no Gather), montado em
 * partes animáveis: pernas e braços giram na caminhada, mãos digitam quando
 * sentado e trabalhando, e o corpo vira de costas quando anda "para o fundo".
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

  private readonly rig = new Container();
  private readonly legL = new Graphics();
  private readonly legR = new Graphics();
  private readonly armL = new Graphics();
  private readonly armR = new Graphics();
  private readonly torso = new Graphics();
  private readonly head = new Graphics();
  private readonly bubble = new Graphics();
  private readonly doc = new Graphics();
  private path: Vec2[] = [];
  private onArrive: (() => void) | null = null;
  private t = Math.random() * 10;
  private facingX: 1 | -1 = 1;
  private facingBack = false;
  private walkPhase = 0;
  private lastStepIndex = 0;
  /** Altura da cadeira aplicada agora (0 = de pé, 1 = sentado), animada entre os dois. */
  private lift = 0;
  private walkTime = 0;

  constructor(public readonly id: string, public look: ActorLook) {
    super();
    this.rig.addChild(this.legL, this.legR, this.armL, this.armR, this.torso, this.doc, this.head);
    this.addChild(this.rig);
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
    this.lift = seated ? 1 : 0;
    this.path = [];
    this.onArrive = null;
    this.facingBack = false;
    this.syncPosition();
    this.redraw();
  }

  /** Reposiciona na tela (após rotação da câmera). */
  refresh(): void {
    this.syncPosition();
  }

  setLook(look: ActorLook): void {
    const same = look.shirt === this.look.shirt && look.hair === this.look.hair && look.skin === this.look.skin;
    this.look = look;
    if (!same) this.redraw();
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
    // levanta da cadeira (a altura desce em `update`) antes de sair andando
    this.seated = false;
    this.path = path.slice();
    this.onArrive = onArrive ?? null;
    this.walkTime = 0;
    this.redraw();
  }

  /** Senta na cadeira: posiciona e desce até a altura do assento. */
  sit(x: number, y: number): void {
    this.wx = x;
    this.wy = y;
    this.path = [];
    this.onArrive = null;
    this.facingBack = false;
    this.seated = true;
    this.redraw();
  }

  /** Avança a animação. `dt` em segundos. Retorna true quando um pé toca o chão. */
  update(dt: number): boolean {
    this.t += dt;
    let stepped = false;
    // levantar / sentar: a altura acompanha o estado com uma transição curta
    const liftTarget = this.seated ? 1 : 0;
    if (this.lift !== liftTarget) {
      const k = dt / SEAT_TRANSITION_S;
      this.lift = liftTarget > this.lift ? Math.min(1, this.lift + k) : Math.max(0, this.lift - k);
    }
    // só começa a andar depois de ficar de pé
    if (this.path.length > 0 && this.lift < 0.05) {
      this.walkTime += dt;
      const target = this.path[0]!;
      const dx = target.x - this.wx;
      const dy = target.y - this.wy;
      const dist = Math.hypot(dx, dy);
      // arranque suave e freada perto do destino final
      const last = this.path[this.path.length - 1]!;
      const remaining = Math.hypot(last.x - this.wx, last.y - this.wy);
      const accel = Math.min(1, 0.35 + this.walkTime / ACCEL_S);
      const brake = this.path.length === 1 ? Math.max(0.35, Math.min(1, remaining / BRAKE_TILES)) : 1;
      const step = WALK_SPEED * accel * brake * dt;
      if (dist <= step) {
        this.wx = target.x;
        this.wy = target.y;
        this.path.shift();
        if (this.path.length === 0) {
          const cb = this.onArrive;
          this.onArrive = null;
          this.walkPhase = 0;
          this.facingBack = false;
          this.redraw();
          cb?.();
        }
      } else {
        this.wx += (dx / dist) * step;
        this.wy += (dy / dist) * step;
        // direção na tela: usa a projeção para respeitar a rotação da câmera
        const a = toScreen(this.wx, this.wy);
        const b = toScreen(this.wx + dx / dist, this.wy + dy / dist);
        const sx = b.x - a.x;
        const sy = b.y - a.y;
        if (Math.abs(sx) > 0.05) this.facingX = sx > 0 ? 1 : -1;
        const back = sy < -0.05;
        if (back !== this.facingBack) { this.facingBack = back; this.redrawHead(); this.redrawTorso(); }
        this.walkPhase += dt * 11;
        const idx = Math.floor(this.walkPhase / Math.PI);
        if (idx !== this.lastStepIndex) { this.lastStepIndex = idx; stepped = true; }
      }
    }
    this.syncPosition();
    this.animate();
    return stepped;
  }

  private animate(): void {
    const t = this.t;
    const walking = this.walking && this.lift < 0.05;
    this.rig.scale.x = this.facingX;
    const legsAlpha = Math.max(0, Math.min(1, (0.7 - this.lift) / 0.5));
    this.legL.visible = this.legR.visible = legsAlpha > 0;
    this.legL.alpha = this.legR.alpha = legsAlpha;
    if (walking) {
      const s = Math.sin(this.walkPhase);
      this.legL.rotation = s * 0.55;
      this.legR.rotation = -s * 0.55;
      this.armL.rotation = -s * 0.45;
      this.armR.rotation = s * 0.45;
      this.rig.y = -Math.abs(Math.sin(this.walkPhase)) * 2.2;
      this.torso.rotation = s * 0.04;
      this.head.rotation = -s * 0.03;
    } else {
      this.legL.rotation = 0;
      this.legR.rotation = 0;
      this.torso.rotation = 0;
      this.head.rotation = 0;
      if (this.seated && this.status === "working") {
        // digitando: braços junto ao corpo (pose do kit) com um tremor leve de teclado
        this.armL.rotation = 0.12 + Math.sin(t * 14) * 0.05;
        this.armR.rotation = -0.12 + Math.cos(t * 14) * 0.05;
        this.rig.y = Math.sin(t * 3) * 0.5;
      } else if (this.seated) {
        this.armL.rotation = 0;
        this.armR.rotation = 0;
        this.rig.y = Math.sin(t * 1.6) * 0.5;
      } else {
        this.armL.rotation = Math.sin(t * 1.4) * 0.03;
        this.armR.rotation = -Math.sin(t * 1.4) * 0.03;
        this.rig.y = this.status === "checkpoint" ? Math.sin(t * 1.5) * 0.6 : Math.sin(t * 1.6) * 0.5;
      }
      // respiração
      this.torso.scale.y = 1 + Math.sin(t * 1.6) * 0.015;
    }
    this.bubble.y = Math.sin(t * 2) * 1.6;
    if (this.status === "checkpoint" || this.status === "delivering") {
      const pulse = 0.85 + Math.sin(t * 4) * 0.15;
      this.bubble.scale.set(pulse);
      this.fx.alpha = 0.7 + Math.sin(t * 3) * 0.25;
    } else {
      this.bubble.scale.set(1);
      this.fx.alpha = 1;
    }
  }

  private syncPosition(): void {
    const p = toScreen(this.wx, this.wy, SEATED_Z * this.lift);
    this.position.set(p.x, p.y);
    const g = toScreen(this.wx, this.wy, 0);
    this.ground.position.set(g.x, g.y);
    this.fx.position.set(g.x, g.y);
  }

  private redraw(): void {
    this.redrawLegs();
    this.redrawArms();
    this.redrawTorso();
    this.redrawHead();
    this.redrawBubble();
    this.redrawDoc();
    this.redrawGround();
    this.redrawFx();
  }

  private get torsoTop(): number {
    return this.seated ? -22 : -25;
  }

  private redrawLegs(): void {
    // sempre desenhadas; a visibilidade acompanha a altura da cadeira em `animate`
    for (const [g, side] of [[this.legL, -1], [this.legR, 1]] as Array<[Graphics, number]>) {
      g.clear();
      g.position.set(side * 4, -LEG_LEN);
      g.roundRect(-2.5, 0, 5, LEG_LEN, 2).fill(0x2b2825);
      g.roundRect(-3.5, LEG_LEN - 3, 7, 3.2, 1.5).fill(PALETTE.graphite);
    }
  }

  /** Braços: blocos na cor da camisa, um tom abaixo (kit visual). Giram a partir do ombro. */
  private redrawArms(): void {
    const sleeve = shade(this.look.shirt, 0.82);
    for (const [g, side] of [[this.armL, -1], [this.armR, 1]] as Array<[Graphics, number]>) {
      g.clear();
      g.position.set(side * 10.25, this.torsoTop + 2);
      g.roundRect(-2.25, 0, 4.5, ARM_LEN, 2.2).fill(sleeve);
    }
  }

  private redrawTorso(): void {
    const g = this.torso;
    g.clear();
    const ty = this.torsoTop;
    g.position.set(0, 0);
    g.roundRect(-9, ty, 18, 16, 4.5).fill(this.look.shirt);
    g.roundRect(2.5, ty, 6.5, 16, 3).fill({ color: PALETTE.graphite, alpha: 0.14 });
    if (!this.facingBack) g.ellipse(-4, ty + 4, 3.5, 2).fill({ color: 0xffffff, alpha: 0.22 });
    // pescoço
    g.rect(-2.5, ty - 3, 5, 4).fill(shade(this.look.skin, 0.85));
  }

  private redrawHead(): void {
    const g = this.head;
    g.clear();
    const { hair, skin } = this.look;
    const hy = this.torsoTop - 16;
    g.position.set(0, 0);
    g.roundRect(-7.5, hy, 15, 14.5, 5.5).fill(skin);
    g.roundRect(2.5, hy, 5, 14.5, 3).fill({ color: PALETTE.graphite, alpha: 0.1 });
    if (this.facingBack) {
      // andando para o fundo: nuca coberta de cabelo
      g.roundRect(-7.5, hy - 1, 15, 13, 5.5).fill(hair);
      return;
    }
    g.roundRect(-8, hy - 1.5, 16, 7, 5).fill(hair);
    g.roundRect(-8, hy + 3, 3.2, 6, 1.5).fill(hair);
    g.circle(-3, hy + 8.5, 1.2).fill(PALETTE.graphite);
    g.circle(3, hy + 8.5, 1.2).fill(PALETTE.graphite);
    g.ellipse(-5, hy + 11, 1.8, 1).fill({ color: 0xe88a7a, alpha: 0.5 });
  }

  private redrawBubble(): void {
    const g = this.bubble;
    g.clear();
    if (this.look.isUser) return;
    const ty = this.torsoTop;
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
  }

  private redrawDoc(): void {
    const g = this.doc;
    g.clear();
    if (!this.showDoc) return;
    // folha inclinada 8° na mão direita, como no kit
    g.position.set(7, this.torsoTop + 4);
    g.rotation = (-8 * Math.PI) / 180;
    g.roundRect(0, 0, 11, 14, 1.5).fill(PALETTE.paperWhite).stroke({ width: 0.8, color: 0x8f8c84 });
    g.rect(2, 3, 7, 1.2).fill(STATUS_COLORS.delivering);
    g.rect(2, 6, 7, 1.2).fill(0xbdb7ab);
    g.rect(2, 9, 5, 1.2).fill(0xbdb7ab);
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
    const cy = 0.55 * TILE_H;
    g.ellipse(0, cy, 1.1 * TILE_W, 1.1 * TILE_H).stroke({ width: 1.5, color: PALETTE.accent, alpha: 0.5 });
    g.ellipse(0, cy, 0.75 * TILE_W, 0.75 * TILE_H).stroke({ width: 1.5, color: PALETTE.accent, alpha: 0.8 });
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
