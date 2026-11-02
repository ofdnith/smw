/** Loop de timestep fixo (60 Hz) com render interpolado na taxa do monitor. */

export const STEP_MS = 1000 / 60;
const MAX_UPDATES_PER_FRAME = 5;

export interface LoopCallbacks {
  update: () => void;
  render: (alpha: number) => void;
}

export class GameLoop {
  private acc = 0;
  private last = 0;
  private running = false;
  private rafId = 0;
  /** Contador global de frames de lógica (determinístico). */
  frame = 0;

  constructor(private readonly cb: LoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number): void => {
      if (!this.running) return;
      let dt = now - this.last;
      this.last = now;
      if (dt > 250) dt = 250; // aba em segundo plano: não acumula
      this.acc += dt;
      let n = 0;
      while (this.acc >= STEP_MS && n < MAX_UPDATES_PER_FRAME) {
        this.cb.update();
        this.frame++;
        this.acc -= STEP_MS;
        n++;
      }
      if (n === MAX_UPDATES_PER_FRAME) this.acc = 0; // evita espiral da morte
      this.cb.render(this.acc / STEP_MS);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}
