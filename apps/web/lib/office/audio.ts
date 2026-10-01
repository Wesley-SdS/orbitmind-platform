/**
 * Som ambiente do escritório, sintetizado com Web Audio (sem arquivos):
 * ruído de sala bem baixo, teclas quando há agentes trabalhando, passos
 * quando alguém anda, um "whoosh" no handoff e um sino no checkpoint.
 * Só liga depois de um gesto do usuário (política de autoplay dos navegadores).
 */
export class OfficeAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private noise: AudioBuffer | null = null;
  private workingCount = 0;
  private lastStep = 0;
  enabled = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    // ruído marrom (mais grave que o branco) para a sala e para os passos
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    this.noise = buffer;
    return ctx;
  }

  async enable(): Promise<void> {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    this.enabled = true;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
    this.startAmbient();
    this.scheduleTyping();
  }

  disable(): void {
    const ctx = this.ctx;
    this.enabled = false;
    if (this.typingTimer) { clearTimeout(this.typingTimer); this.typingTimer = null; }
    if (ctx && this.master) {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      setTimeout(() => { if (!this.enabled) ctx.suspend().catch(() => {}); }, 900);
    }
  }

  destroy(): void {
    this.disable();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
  }

  /** Quantos agentes estão digitando: controla a densidade das teclas. */
  setWorking(count: number): void {
    this.workingCount = count;
  }

  private startAmbient(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise || this.ambientGain) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    // respiração lenta do volume
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(gain.gain);
    src.connect(lp).connect(gain).connect(this.master);
    src.start();
    lfo.start();
    this.ambientGain = gain;
  }

  private scheduleTyping(): void {
    if (!this.enabled) return;
    const n = this.workingCount;
    const delay = n > 0 ? 90 + Math.random() * (420 / Math.min(n, 4)) : 700;
    this.typingTimer = setTimeout(() => {
      if (this.enabled && this.workingCount > 0 && Math.random() < 0.85) this.click();
      this.scheduleTyping();
    }, delay);
  }

  /** Tecla: estalo curto e agudo, posição estéreo aleatória. */
  private click(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800 + Math.random() * 1200;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.4 - 0.7;
    src.connect(hp).connect(gain).connect(pan).connect(this.master);
    src.start(t, Math.random() * 1.5, 0.05);
  }

  /** Passo: sopro grave e curto. Limitado a um a cada 120 ms. */
  footstep(): void {
    const ctx = this.ctx;
    if (!this.enabled || !ctx || !this.master || !this.noise) return;
    const now = performance.now();
    if (now - this.lastStep < 120) return;
    this.lastStep = now;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(lp).connect(gain).connect(this.master);
    src.start(t, Math.random() * 1.5, 0.12);
  }

  /** Handoff: varredura de ruído filtrado, como uma folha passando. */
  whoosh(): void {
    const ctx = this.ctx;
    if (!this.enabled || !ctx || !this.master || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    const t = ctx.currentTime;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.35);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    src.connect(bp).connect(gain).connect(this.master);
    src.start(t, 0.2, 0.5);
  }

  /** Checkpoint: dois tons curtos (mi5 → lá5). */
  chime(): void {
    const ctx = this.ctx;
    if (!this.enabled || !ctx || !this.master) return;
    const t = ctx.currentTime;
    const tone = (freq: number, at: number, dur: number): void => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(this.master!);
      osc.start(at);
      osc.stop(at + dur + 0.05);
    };
    tone(659.25, t, 0.5);
    tone(880, t + 0.18, 0.7);
  }
}
