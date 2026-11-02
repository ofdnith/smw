/** Entrada: teclado, Gamepad API e toque, amostrada uma vez por frame de lógica. */

export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'run' | 'spin' | 'pause' | 'item';
export const ACTIONS: Action[] = ['left', 'right', 'up', 'down', 'jump', 'run', 'spin', 'pause', 'item'];

const ACTION_BIT: Record<Action, number> = {
  left: 1, right: 2, up: 4, down: 8, jump: 16, run: 32, spin: 64, pause: 128, item: 256,
};

export type KeyMap = Record<string, Action>;

export const DEFAULT_KEYMAP: KeyMap = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyZ: 'jump', Space: 'jump', KeyK: 'jump',
  KeyX: 'run', ShiftLeft: 'run', ShiftRight: 'run', KeyJ: 'run',
  KeyC: 'spin', KeyL: 'spin',
  Enter: 'pause', Escape: 'pause',
  KeyV: 'item', KeyI: 'item',
};

/** Estado de entrada de um frame, como máscara de bits (serializável para replays). */
export class InputState {
  held = 0;
  prevHeld = 0;

  isHeld(a: Action): boolean { return (this.held & ACTION_BIT[a]) !== 0; }
  isPressed(a: Action): boolean { return (this.held & ~this.prevHeld & ACTION_BIT[a]) !== 0; }
  isReleased(a: Action): boolean { return (~this.held & this.prevHeld & ACTION_BIT[a]) !== 0; }
  get axisX(): number { return (this.isHeld('right') ? 1 : 0) - (this.isHeld('left') ? 1 : 0); }
  anyPressed(): boolean { return (this.held & ~this.prevHeld) !== 0; }
}

export class Input {
  readonly state = new InputState();
  keymap: KeyMap = { ...DEFAULT_KEYMAP };
  private keysDown = new Set<string>();
  private touchDown = new Set<Action>();
  /** Quando definido, substitui a entrada real (replays/testes). */
  override: ((frame: number) => number) | null = null;
  /** Último estado real lido (para gravar replays). */
  lastRaw = 0;
  private frame = 0;
  gamepadConnected = false;
  anyGamepadActivity = false;

  constructor(target: Window = window) {
    target.addEventListener('keydown', (e) => {
      if (this.keymap[e.code] !== undefined || e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      this.keysDown.add(e.code);
    });
    target.addEventListener('keyup', (e) => this.keysDown.delete(e.code));
    target.addEventListener('blur', () => this.keysDown.clear());
    target.addEventListener('gamepadconnected', () => { this.gamepadConnected = true; });
    target.addEventListener('gamepaddisconnected', () => { this.gamepadConnected = false; });
  }

  attachTouch(root: HTMLElement): void {
    const buttons = root.querySelectorAll<HTMLElement>('.tb');
    const set = (el: HTMLElement, down: boolean): void => {
      const a = el.dataset.a as Action;
      if (down) this.touchDown.add(a); else this.touchDown.delete(a);
      el.classList.toggle('down', down);
    };
    buttons.forEach((el) => {
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); set(el, true); });
      el.addEventListener('pointerup', () => set(el, false));
      el.addEventListener('pointercancel', () => set(el, false));
      el.addEventListener('pointerleave', () => set(el, false));
    });
  }

  private readRaw(): number {
    let mask = 0;
    for (const code of this.keysDown) {
      const a = this.keymap[code];
      if (a) mask |= ACTION_BIT[a];
    }
    for (const a of this.touchDown) mask |= ACTION_BIT[a];
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const b = (i: number): boolean => !!gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] ?? 0, ay = gp.axes[1] ?? 0;
      let m = 0;
      if (b(14) || ax < -0.5) m |= ACTION_BIT.left;
      if (b(15) || ax > 0.5) m |= ACTION_BIT.right;
      if (b(12) || ay < -0.5) m |= ACTION_BIT.up;
      if (b(13) || ay > 0.5) m |= ACTION_BIT.down;
      if (b(0)) m |= ACTION_BIT.jump; // A / Cruz
      if (b(2) || b(3) || b(6) || b(7) || b(4) || b(5)) m |= ACTION_BIT.run; // X / Quadrado / gatilhos / ombros
      if (b(1)) m |= ACTION_BIT.spin; // B / Círculo
      if (b(9)) m |= ACTION_BIT.pause;
      if (b(8)) m |= ACTION_BIT.item;
      if (m) this.anyGamepadActivity = true;
      mask |= m;
    }
    return mask;
  }

  /** Chamado uma vez por frame de lógica. */
  poll(): void {
    this.state.prevHeld = this.state.held;
    this.lastRaw = this.readRaw();
    this.state.held = this.override ? this.override(this.frame) : this.lastRaw;
    this.frame++;
  }

  reset(): void {
    this.state.held = 0;
    this.state.prevHeld = 0;
    this.frame = 0;
  }
}
