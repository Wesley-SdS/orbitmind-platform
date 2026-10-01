import { Application, BlurFilter, Container, Graphics, type FederatedPointerEvent } from "pixi.js";
import {
  TILE_H, TILE_W, Z_UNIT, getRotation, isoRaw, rotRect, setBuildingSize, setRotation, toScreen, toWorld, type Vec2,
} from "./projection";
import { NavGrid, simplifyPath } from "./pathfinding";
import { drawBuildingBase, drawGlobalLight, drawRoomFloor, drawRug, drawWallAO } from "./floors";
import { buildAllWalls } from "./walls";
import { DeskActor, buildChair, buildFurniture, buildWindows, type Layers } from "./furniture";
import { AgentActor, type ActorLook } from "./agent-actor";
import { dashedPolyline } from "./draw";
import { PALETTE, STATUS_COLORS } from "./palette";
import {
  BUILDING_D, BUILDING_W, DESKS, EXTERIOR_WALL_HEIGHT, FURNITURE, OFFICE_ROOMS, USER_START, WINDOWS, blockedCells,
} from "@/lib/office/room-layout";
import { ZOOM_UNIT } from "@/lib/office/camera";
import { USER_ID, type OfficeAgentStatus, type OfficeSeat } from "@/lib/office/types";

export interface SceneAgentInput {
  id: string;
  status: OfficeAgentStatus;
  seat: OfficeSeat;
  look: ActorLook;
}

export interface SceneEvents {
  onAgentClick?: (id: string) => void;
  onAgentHover?: (id: string | null) => void;
  onFloorClick?: (pos: Vec2) => void;
  onZoomChange?: (zoom: number) => void;
  onUserPan?: () => void;
  /** Um pé tocou o chão (para som de passos). */
  onFootstep?: () => void;
  /** A planta foi reconstruída (rotação da câmera). */
  onRebuild?: () => void;
  /** A câmera girou (0..3), para salvar a preferência. */
  onRotationChange?: (rotation: number) => void;
}

/** Duração das metades da transição de rotação (esmaece → gira → reaparece), em segundos. */
const FADE_OUT_S = 0.14;
const FADE_IN_S = 0.2;

export interface Anchor {
  x: number;
  y: number;
}

const MIN_ZOOM = 0.5 * ZOOM_UNIT;
const MAX_ZOOM = 3 * ZOOM_UNIT;
/** Meia-diagonal do gramado em tiles (prédio + 1,2 de folga atrás e 1,6 na frente, nos dois eixos). */
const LAWN_SPAN = BUILDING_W + BUILDING_D + 5.6;
export { USER_ID };

/**
 * Cena PixiJS do escritório isométrico: constrói a planta, mantém os atores
 * dos agentes, a câmera (pan/zoom/seguir/girar) e expõe âncoras em pixels
 * para as etiquetas em HTML.
 */
export class OfficeScene {
  private app: Application | null = null;
  private host: HTMLElement | null = null;
  private readonly world = new Container();
  private staticLayers: Container[] = [];
  private objects = new Container();
  private groundFx = new Graphics();
  private trails = new Graphics();
  private nav = new NavGrid(BUILDING_W, BUILDING_D);
  private desks: DeskActor[] = [];
  private readonly actors = new Map<string, AgentActor>();
  private lastAgents: SceneAgentInput[] = [];
  private readonly frameCbs = new Set<(dt: number) => void>();
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private user: AgentActor | null = null;
  private followId: string | null = null;
  private selectedId: string | null = null;
  private snapshotCanvas: HTMLCanvasElement | null = null;
  private snapshotBounds = { x: 0, y: 0, w: 1, h: 1 };
  private drag: { id: number; x: number; y: number; moved: boolean; wx: number; wy: number } | null = null;
  /** Escala do último "ajustar à tela"; o zoom manual pode afastar até ela, mesmo abaixo de 50%. */
  private fitScale = MIN_ZOOM;
  private pinch: { d: number; zoom: number } | null = null;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private cameraTween: { x: number; y: number } | null = null;
  /** Transição de rotação em andamento; `pending` acumula cliques feitos durante ela. */
  private fade: { phase: "out" | "in"; t: number; pending: number } | null = null;
  private inFlight = new Map<string, () => void>();
  private destroyed = false;
  /** Cresce a cada reconstrução (rotação); o minimapa usa para recarregar a miniatura. */
  version = 0;

  constructor(private readonly events: SceneEvents = {}) {
    setBuildingSize(BUILDING_W, BUILDING_D);
  }

  get zoom(): number {
    return this.world.scale.x;
  }

  get ready(): boolean {
    return this.app !== null;
  }

  get rotation(): number {
    return getRotation();
  }

  async init(host: HTMLElement): Promise<void> {
    const app = new Application();
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: "webgl",
    });
    if (this.destroyed) { app.destroy(true); return; }
    this.app = app;
    this.host = host;
    app.canvas.style.display = "block";
    app.canvas.style.touchAction = "none";
    host.appendChild(app.canvas);

    this.buildStatic();
    this.takeSnapshot();
    this.createUser();
    app.stage.addChild(this.world);
    this.fitToView();
    this.bindInput();
    app.ticker.add((ticker) => this.tick(ticker.deltaMS / 1000));
  }

  destroy(): void {
    this.destroyed = true;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    this.frameCbs.clear();
    this.host?.removeEventListener("wheel", this.onWheel);
    if (this.app) {
      const canvas = this.app.canvas;
      this.app.destroy(true, { children: true });
      canvas.remove();
      this.app = null;
    }
    this.host = null;
  }

  // ---------------------------------------------------------------------------
  // Construção
  // ---------------------------------------------------------------------------

  private buildStatic(): void {
    const lawn = new Graphics();
    const buildingShadow = new Graphics();
    const buildingShadowLayer = new Container();
    buildingShadowLayer.addChild(buildingShadow);
    buildingShadowLayer.filters = [new BlurFilter({ strength: 8, quality: 3 })];
    const ground = new Graphics();
    const shadows = new Graphics();
    const lights = new Graphics();
    const shadowLayer = new Container();
    shadowLayer.addChild(shadows);
    shadowLayer.filters = [new BlurFilter({ strength: 3, quality: 2 })];
    const lightLayer = new Container();
    lightLayer.addChild(lights);
    lightLayer.filters = [new BlurFilter({ strength: 6, quality: 2 })];

    this.nav = new NavGrid(BUILDING_W, BUILDING_D);
    this.desks = [];
    this.objects = new Container();
    this.groundFx = new Graphics();
    this.trails = new Graphics();

    drawBuildingBase(lawn, buildingShadow, ground, BUILDING_W, BUILDING_D);
    for (const room of OFFICE_ROOMS) drawRoomFloor(ground, room);
    const light = new Graphics();
    drawGlobalLight(light);
    for (const room of OFFICE_ROOMS) drawWallAO(shadows, room);
    for (const f of FURNITURE) if (f.type === "rug") drawRug(ground, f.x, f.y, f.w, f.d, f.color, f.line);

    this.objects.sortableChildren = true;
    const add = (display: Container, depth: number): void => {
      display.zIndex = depth;
      this.objects.addChild(display);
    };
    const layers: Layers = { ground, shadows, lights, add };

    buildAllWalls(add, ground, OFFICE_ROOMS, this.nav);
    for (const [cx, cy] of blockedCells()) this.nav.blockCell(cx, cy);
    buildWindows(layers, WINDOWS);

    DESKS.forEach((desk) => {
      const actor = new DeskActor(desk.x, desk.y);
      this.desks.push(actor);
      add(actor.container, actor.depth);
      buildChair(layers, desk.x + 0.55, desk.y - 0.75);
    });
    for (const f of FURNITURE) buildFurniture(layers, f);

    this.staticLayers = [lawn, buildingShadowLayer, ground, light, shadowLayer, lightLayer, this.trails, this.groundFx, this.objects];
    for (const layer of this.staticLayers) this.world.addChild(layer);
  }

  /** Derruba a planta e constrói de novo (nova orientação), mantendo os atores. */
  private rebuild(): void {
    for (const finish of this.inFlight.values()) finish();
    this.inFlight.clear();
    for (const a of this.actors.values()) this.detachActor(a);
    if (this.user) this.detachActor(this.user);
    for (const layer of this.staticLayers) {
      layer.removeFromParent();
      layer.destroy({ children: true });
    }
    this.staticLayers = [];
    this.buildStatic();
    this.takeSnapshot();
    if (this.user) { this.mountActor(this.user); this.user.refresh(); }
    for (const a of this.actors.values()) { this.mountActor(a); a.refresh(); }
    this.applyDeskStatuses();
    this.version++;
    this.events.onRebuild?.();
  }

  private createUser(): void {
    const actor = new AgentActor(USER_ID, { shirt: PALETTE.graphite, hair: 0x2a2521, skin: 0xc99671, isUser: true });
    actor.place(USER_START.x, USER_START.y, false);
    this.mountActor(actor);
    this.user = actor;
  }

  private mountActor(actor: AgentActor): void {
    this.groundFx.addChild(actor.ground);
    actor.fx.zIndex = actor.depth - 0.4;
    this.objects.addChild(actor.fx);
    actor.zIndex = actor.depth;
    this.objects.addChild(actor);
    if (actor.id !== USER_ID && actor.listenerCount("pointertap") === 0) {
      actor.on("pointertap", (e: FederatedPointerEvent) => {
        if (this.drag?.moved) return;
        e.stopPropagation();
        this.events.onAgentClick?.(actor.id);
      });
      actor.on("pointerover", () => { actor.setHovered(true); this.events.onAgentHover?.(actor.id); });
      actor.on("pointerout", () => { actor.setHovered(false); this.events.onAgentHover?.(null); });
    }
  }

  private detachActor(actor: AgentActor): void {
    actor.ground.removeFromParent();
    actor.fx.removeFromParent();
    actor.removeFromParent();
  }

  private takeSnapshot(): void {
    if (!this.app) return;
    try {
      const b = this.world.getLocalBounds();
      this.snapshotBounds = { x: b.x, y: b.y, w: b.width, h: b.height };
      const canvas = this.app.renderer.extract.canvas({ target: this.world, resolution: 0.2, antialias: true });
      this.snapshotCanvas = canvas as HTMLCanvasElement;
    } catch {
      this.snapshotCanvas = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Agentes
  // ---------------------------------------------------------------------------

  /** Sincroniza os atores com a lista de agentes (cria, move de lugar, remove). */
  setAgents(list: SceneAgentInput[]): void {
    this.lastAgents = list;
    const seen = new Set<string>();
    for (const a of list) {
      seen.add(a.id);
      let actor = this.actors.get(a.id);
      if (!actor) {
        actor = new AgentActor(a.id, a.look);
        actor.place(a.seat.x, a.seat.y, a.seat.deskIndex !== undefined);
        this.actors.set(a.id, actor);
        this.mountActor(actor);
      } else if (!this.inFlight.has(a.id) && !actor.walking && (Math.abs(actor.wx - a.seat.x) > 0.01 || Math.abs(actor.wy - a.seat.y) > 0.01)) {
        actor.place(a.seat.x, a.seat.y, a.seat.deskIndex !== undefined);
      }
      actor.setLook(a.look);
      if (!this.inFlight.has(a.id)) actor.setStatus(a.status);
    }
    for (const [id, actor] of this.actors) {
      if (seen.has(id)) continue;
      this.detachActor(actor);
      actor.destroy({ children: true });
      this.actors.delete(id);
    }
    this.applyDeskStatuses();
    this.applySelection();
  }

  private applyDeskStatuses(): void {
    const byDesk = new Map<number, OfficeAgentStatus | "off">();
    for (const a of this.lastAgents) {
      if (a.seat.deskIndex === undefined) continue;
      byDesk.set(a.seat.deskIndex, a.status === "delivering" ? "off" : a.status);
    }
    this.desks.forEach((d, i) => d.setStatus(byDesk.get(i) ?? "off"));
  }

  setSelected(id: string | null): void {
    this.selectedId = id;
    this.applySelection();
  }

  private applySelection(): void {
    for (const [id, actor] of this.actors) actor.setSelected(id === this.selectedId);
  }

  hasAgent(id: string): boolean {
    return this.actors.has(id);
  }

  agentPosition(id: string): Vec2 | null {
    const a = id === USER_ID ? this.user : this.actors.get(id);
    return a ? { x: a.wx, y: a.wy } : null;
  }

  /**
   * Handoff: `fromId` levanta, anda até a frente da mesa de `toId` com o
   * documento, espera um instante e volta a sentar.
   */
  handoff(fromId: string, toId: string, seatOf: (id: string) => OfficeSeat | null, onDone?: () => void): void {
    const from = this.actors.get(fromId);
    const to = this.actors.get(toId);
    const homeSeat = seatOf(fromId);
    const targetSeat = seatOf(toId);
    if (!from || !to || !homeSeat || !targetSeat) { onDone?.(); return; }
    if (this.inFlight.has(fromId)) return;

    const target = this.spotInFront(targetSeat);
    const pathOut = this.findPath({ x: from.wx, y: from.wy }, target);
    if (pathOut.length === 0) { onDone?.(); return; }
    const finish = (): void => {
      this.inFlight.delete(fromId);
      this.trails.clear();
      from.setDoc(false);
      if (homeSeat.deskIndex === undefined) from.place(homeSeat.x, homeSeat.y, false);
      else from.sit(homeSeat.x, homeSeat.y);
      onDone?.();
    };
    this.inFlight.set(fromId, finish);
    from.setStatus("delivering");
    from.setDoc(true);
    this.drawTrail(pathOut, STATUS_COLORS.delivering);
    from.walk(pathOut, () => {
      this.after(1400, () => {
        if (!this.inFlight.has(fromId)) return;
        this.trails.clear();
        from.setDoc(false);
        const back = this.findPath({ x: from.wx, y: from.wy }, { x: homeSeat.x, y: homeSeat.y });
        from.walk(back, finish);
      });
    });
  }

  /** Cancela handoffs em andamento (troca de squad). */
  cancelAnimations(): void {
    for (const finish of this.inFlight.values()) finish();
    this.inFlight.clear();
  }

  /** Avatar humano anda até um ponto do mundo. */
  walkUserTo(pos: Vec2, onArrive?: () => void): void {
    if (!this.user) return;
    const path = this.findPath({ x: this.user.wx, y: this.user.wy }, pos);
    if (path.length === 0) return;
    this.drawTrail(path, PALETTE.accent);
    this.user.walk(path, () => { this.trails.clear(); onArrive?.(); });
  }

  /** Avatar humano anda até a frente da mesa (ou do lugar) de um agente. */
  walkUserToAgent(id: string, seat: OfficeSeat, onArrive?: () => void): void {
    this.walkUserTo(this.spotInFront(seat), onArrive);
  }

  private spotInFront(seat: OfficeSeat): Vec2 {
    if (seat.deskIndex !== undefined) return { x: seat.x, y: seat.y + 1.7 };
    return { x: seat.x + 0.9, y: seat.y + 0.4 };
  }

  private findPath(from: Vec2, to: Vec2): Vec2[] {
    const raw = this.nav.findPath(from, to);
    if (raw.length === 0) return [];
    const path = simplifyPath(raw);
    path[0] = { x: from.x, y: from.y };
    const last = this.nav.nearestWalkable(to.x, to.y);
    if (Math.floor(to.x) === last.x && Math.floor(to.y) === last.y) path[path.length - 1] = { x: to.x, y: to.y };
    return path;
  }

  private drawTrail(path: Vec2[], color: number): void {
    this.trails.clear();
    const pts = path.map((p) => toScreen(p.x, p.y));
    dashedPolyline(this.trails, pts, 6, 5, { width: 2.2, color, alpha: 0.9 });
    const end = pts[pts.length - 1]!;
    const prev = pts[pts.length - 2] ?? end;
    const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
    const a1 = { x: end.x - Math.cos(ang + 0.5) * 10, y: end.y - Math.sin(ang + 0.5) * 10 };
    const a2 = { x: end.x - Math.cos(ang - 0.5) * 10, y: end.y - Math.sin(ang - 0.5) * 10 };
    this.trails.poly([end.x, end.y, a1.x, a1.y, a2.x, a2.y]).fill(color);
  }

  private after(ms: number, fn: () => void): void {
    const t = setTimeout(() => { this.timers.delete(t); if (!this.destroyed) fn(); }, ms);
    this.timers.add(t);
  }

  // ---------------------------------------------------------------------------
  // Câmera
  // ---------------------------------------------------------------------------

  private viewSize(): { w: number; h: number } {
    if (!this.app) return { w: 1, h: 1 };
    return { w: this.app.screen.width, h: this.app.screen.height };
  }

  fitToView(): void {
    const { w, h } = this.viewSize();
    // como na prancha 01: o gramado passa 9 px de cada lado do palco e o centro do prédio fica 20 px abaixo do meio
    const lawnW = (LAWN_SPAN * TILE_W) / 2;
    const lawnH = (LAWN_SPAN * TILE_H) / 2;
    const compact = w < 520;
    const scale = Math.min(MAX_ZOOM, compact ? Math.min((w + 12) / lawnW, (h - 8) / lawnH) : Math.min((w + 18) / lawnW, (h - 110) / lawnH));
    this.fitScale = scale;
    const c = toScreen(BUILDING_W / 2 + 0.2, BUILDING_D / 2 + 0.2, 0);
    this.world.scale.set(scale);
    this.world.position.set(w / 2 - c.x * scale, h / 2 - c.y * scale + (compact ? 15 : 20));
    this.cameraTween = null;
    this.events.onZoomChange?.(scale);
  }

  setZoom(next: number, around?: { x: number; y: number }): void {
    const { w, h } = this.viewSize();
    const z = Math.max(Math.min(MIN_ZOOM, this.fitScale), Math.min(MAX_ZOOM, next));
    const px = around?.x ?? w / 2;
    const py = around?.y ?? h / 2;
    const cur = this.world.scale.x;
    const lx = (px - this.world.x) / cur;
    const ly = (py - this.world.y) / cur;
    this.world.scale.set(z);
    this.world.position.set(px - lx * z, py - ly * z);
    this.cameraTween = null;
    this.events.onZoomChange?.(z);
  }

  zoomBy(factor: number): void {
    this.setZoom(this.world.scale.x * factor);
  }

  /** Gira a câmera 90° (delta = ±1), mantendo o ponto do mundo que está no centro da tela. */
  /** Gira a câmera 90° (delta = ±1) com uma transição curta; cliques durante ela se acumulam. */
  rotate(delta: number): void {
    if (!this.app || delta === 0) return;
    if (this.fade) { this.fade.pending += delta; return; }
    this.fade = { phase: "out", t: 0, pending: delta };
  }

  /** Aplica uma orientação salva (0..3) sem animação — usado ao abrir o escritório. */
  setRotationTo(rotation: number): void {
    const delta = ((((rotation - getRotation()) % 4) + 4) % 4);
    if (delta !== 0) this.rotateNow(delta);
  }

  private rotateNow(delta: number): void {
    if (!this.app) return;
    const { w, h } = this.viewSize();
    const center = this.unproject(w / 2, h / 2);
    setRotation(getRotation() + delta);
    this.trails.clear();
    this.rebuild();
    const s = this.world.scale.x;
    const local = toScreen(center.x, center.y, 0);
    this.world.position.set(w / 2 - local.x * s, h / 2 - local.y * s);
    this.cameraTween = null;
    this.events.onRotationChange?.(getRotation());
  }

  private stepFade(dt: number): void {
    const f = this.fade;
    if (!f) return;
    f.t += dt;
    if (f.phase === "out") {
      this.world.alpha = Math.max(0, 1 - f.t / FADE_OUT_S);
      if (f.t >= FADE_OUT_S) {
        const delta = f.pending;
        f.pending = 0;
        if (delta % 4 !== 0) this.rotateNow(delta);
        f.phase = "in";
        f.t = 0;
      }
    } else {
      this.world.alpha = Math.min(1, f.t / FADE_IN_S);
      if (f.t >= FADE_IN_S) {
        this.world.alpha = 1;
        const more = f.pending;
        this.fade = more % 4 !== 0 ? { phase: "out", t: 0, pending: more } : null;
      }
    }
  }

  /** Centraliza a câmera num agente (com animação). */
  focusOn(id: string, zoom?: number): void {
    const actor = id === USER_ID ? this.user : this.actors.get(id);
    if (!actor) return;
    if (zoom !== undefined) this.setZoom(zoom);
    const { w, h } = this.viewSize();
    const s = this.world.scale.x;
    const local = toScreen(actor.wx, actor.wy, 0);
    this.cameraTween = { x: w / 2 - local.x * s, y: h / 2 - local.y * s + 20 * s };
  }

  follow(id: string | null): void {
    this.followId = id;
    if (id) this.focusOn(id);
  }

  get following(): string | null {
    return this.followId;
  }

  /** Converte mundo → pixels relativos ao elemento host. */
  project(x: number, y: number, z = 0): Anchor {
    const p = toScreen(x, y, z);
    const s = this.world.scale.x;
    return { x: this.world.x + p.x * s, y: this.world.y + p.y * s };
  }

  /** Ponto de tela → tile do mundo. */
  unproject(sx: number, sy: number): Vec2 {
    const s = this.world.scale.x;
    return toWorld((sx - this.world.x) / s, (sy - this.world.y) / s);
  }

  /** Âncora (centro x, base y) para a etiqueta de nome, acima do balão. */
  agentAnchor(id: string): Anchor | null {
    const actor = id === USER_ID ? this.user : this.actors.get(id);
    if (!actor) return null;
    const s = this.world.scale.x;
    const hasBubble = actor.status !== "idle" && !actor.look.isUser;
    const ty = actor.seated ? -22 : -25;
    // como no design: 12 px acima do balão, ou 6 px acima da cabeça
    const offset = hasBubble ? ty - 16 - 12 - 12 : ty - 16 - 6;
    return {
      x: this.world.x + actor.x * s,
      y: this.world.y + (actor.y + offset) * s,
    };
  }

  /** Move a câmera (com animação) para um ponto local do mundo (escala 1). */
  panToLocal(lx: number, ly: number): void {
    const { w, h } = this.viewSize();
    const s = this.world.scale.x;
    this.followId = null;
    this.cameraTween = { x: w / 2 - lx * s, y: h / 2 - ly * s };
  }

  /**
   * Âncora da etiqueta de uma sala, no espaço rotacionado, como no design:
   * salas encostadas na parede de fundo ganham a etiqueta centralizada acima
   * dela (0,55 unidade acima do topo); as outras, abaixo da frente de vidro.
   */
  roomAnchor(roomId: string): (Anchor & { placement: "above" | "below" }) | null {
    const room = OFFICE_ROOMS.find((r) => r.id === roomId);
    if (!room) return null;
    const R = rotRect(room.x, room.y, room.w, room.h);
    const s = this.world.scale.x;
    const toAnchor = (p: { x: number; y: number }): Anchor => ({ x: this.world.x + p.x * s, y: this.world.y + p.y * s });
    if (R.y <= 1.01) {
      return { ...toAnchor(isoRaw(R.x + R.w / 2, R.y, EXTERIOR_WALL_HEIGHT + 0.55)), placement: "above" };
    }
    return { ...toAnchor(isoRaw(R.x + R.w / 2, R.y + R.d + 0.58, 0)), placement: "below" };
  }

  /** Retângulo visível em coordenadas locais do mundo (para o minimapa). */
  viewportRect(): { x: number; y: number; w: number; h: number } {
    const { w, h } = this.viewSize();
    const s = this.world.scale.x;
    return { x: -this.world.x / s, y: -this.world.y / s, w: w / s, h: h / s };
  }

  /** Imagem estática do escritório (tirada a cada construção) e seus limites locais. */
  get minimap(): { canvas: HTMLCanvasElement; bounds: { x: number; y: number; w: number; h: number } } | null {
    return this.snapshotCanvas ? { canvas: this.snapshotCanvas, bounds: this.snapshotBounds } : null;
  }

  /** Posições locais (mundo, escala 1) dos agentes, para pontos no minimapa. */
  actorLocalPositions(): Array<{ id: string; x: number; y: number; status: OfficeAgentStatus; isUser: boolean }> {
    const out: Array<{ id: string; x: number; y: number; status: OfficeAgentStatus; isUser: boolean }> = [];
    for (const [id, a] of this.actors) {
      const p = toScreen(a.wx, a.wy);
      out.push({ id, x: p.x, y: p.y, status: a.status, isUser: false });
    }
    if (this.user) {
      const p = toScreen(this.user.wx, this.user.wy);
      out.push({ id: USER_ID, x: p.x, y: p.y, status: "idle", isUser: true });
    }
    return out;
  }

  onFrame(cb: (dt: number) => void): () => void {
    this.frameCbs.add(cb);
    return () => { this.frameCbs.delete(cb); };
  }

  // ---------------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------------

  private tick(dt: number): void {
    if (!this.app) return;
    const step = Math.min(dt, 0.1);
    this.stepFade(step);
    let stepped = false;
    for (const a of this.actors.values()) {
      if (a.update(step)) stepped = true;
      a.zIndex = a.depth;
      a.fx.zIndex = a.depth - 0.4;
    }
    if (this.user) {
      if (this.user.update(step)) stepped = true;
      this.user.zIndex = this.user.depth;
      this.user.fx.zIndex = this.user.depth - 0.4;
    }
    if (stepped) this.events.onFootstep?.();
    if (this.followId) {
      const actor = this.followId === USER_ID ? this.user : this.actors.get(this.followId);
      if (actor) {
        const { w, h } = this.viewSize();
        const s = this.world.scale.x;
        const local = toScreen(actor.wx, actor.wy, 0);
        this.cameraTween = { x: w / 2 - local.x * s, y: h / 2 - local.y * s + 20 * s };
      }
    }
    if (this.cameraTween && !this.drag) {
      const k = 1 - Math.pow(0.001, step);
      this.world.x += (this.cameraTween.x - this.world.x) * k;
      this.world.y += (this.cameraTween.y - this.world.y) * k;
      if (Math.abs(this.cameraTween.x - this.world.x) < 0.3 && Math.abs(this.cameraTween.y - this.world.y) < 0.3) {
        this.world.position.set(this.cameraTween.x, this.cameraTween.y);
        if (!this.followId) this.cameraTween = null;
      }
    }
    for (const cb of this.frameCbs) cb(step);
  }

  // ---------------------------------------------------------------------------
  // Input: arrastar para mover, scroll/pinça para zoom, toque no chão para andar
  // ---------------------------------------------------------------------------

  private bindInput(): void {
    if (!this.app || !this.host) return;
    const stage = this.app.stage;
    stage.eventMode = "static";
    stage.hitArea = this.app.screen;

    stage.on("pointerdown", (e: FederatedPointerEvent) => {
      this.pointers.set(e.pointerId, { x: e.global.x, y: e.global.y });
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = { d: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: this.world.scale.x };
        this.drag = null;
        return;
      }
      this.drag = { id: e.pointerId, x: e.global.x, y: e.global.y, moved: false, wx: this.world.x, wy: this.world.y };
    });
    stage.on("pointermove", (e: FederatedPointerEvent) => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.global.x, y: e.global.y });
      if (this.pinch && this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        const mid = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 };
        this.setZoom(this.pinch.zoom * (d / this.pinch.d), mid);
        return;
      }
      if (!this.drag || this.drag.id !== e.pointerId) return;
      const dx = e.global.x - this.drag.x;
      const dy = e.global.y - this.drag.y;
      if (!this.drag.moved && Math.hypot(dx, dy) > 5) {
        this.drag.moved = true;
        this.followId = null;
        this.cameraTween = null;
        this.events.onUserPan?.();
      }
      if (this.drag.moved) this.world.position.set(this.drag.wx + dx, this.drag.wy + dy);
    });
    const end = (e: FederatedPointerEvent): void => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (this.drag && this.drag.id === e.pointerId) {
        const wasTap = !this.drag.moved;
        this.drag = null;
        if (wasTap && e.target === stage) {
          const w = this.unproject(e.global.x, e.global.y);
          if (w.x >= 0 && w.y >= 0 && w.x < BUILDING_W && w.y < BUILDING_D) this.events.onFloorClick?.(w);
        }
      }
    };
    stage.on("pointerup", end);
    stage.on("pointerupoutside", end);
    stage.on("pointercancel", end);

    this.host.addEventListener("wheel", this.onWheel, { passive: false });
  }

  private readonly onWheel = (e: WheelEvent): void => {
    if (!this.host) return;
    e.preventDefault();
    const rect = this.host.getBoundingClientRect();
    const factor = Math.exp(-e.deltaY * 0.0012);
    this.setZoom(this.world.scale.x * factor, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
}

export { TILE_W, TILE_H, Z_UNIT };
