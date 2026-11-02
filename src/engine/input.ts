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

/** Ações que o jogador pode remapear (direções ficam fixas: setas/WASD e direcional). */
export const REMAPPABLE: Action[] = ['jump', 'run', 'spin', 'item', 'pause'];

export type PadMap = Record<Action, number[]>;
export const DEFAULT_PADMAP: PadMap = {
  left: [14], right: [15], up: [12], down: [13],
  jump: [0], run: [2, 3, 4, 5, 6, 7], spin: [1], pause: [9], item: [8],
};

/** Nome legível de uma tecla (KeyboardEvent.code). */
export function keyLabel(code: string | undefined): string {
  if (!code) return '-';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'NUM ' + code.slice(6).toUpperCase();
  const names: Record<string, string> = {
    Space: 'ESPACO', Enter: 'ENTER', Escape: 'ESC', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT DIR', ControlLeft: 'CTRL', ControlRight: 'CTRL DIR',
    AltLeft: 'ALT', AltRight: 'ALT DIR', Tab: 'TAB', Backspace: 'APAGAR', ArrowLeft: 'SETA ESQ', ArrowRight: 'SETA DIR', ArrowUp: 'SETA CIMA', ArrowDown: 'SETA BAIXO',
    Comma: 'VIRGULA', Period: 'PONTO', Slash: 'BARRA', Semicolon: 'PONTO E VIRGULA', MetaLeft: 'CMD', MetaRight: 'CMD DIR',
  };
  return names[code] ?? code.toUpperCase();
}

/** Monta o mapa de teclas: padrão + escolhas do jogador (a escolha rouba a tecla de outra ação). */
export function buildKeymap(custom: Partial<Record<Action, string>>): KeyMap {
  const km: KeyMap = { ...DEFAULT_KEYMAP };
  for (const a of REMAPPABLE) {
    const code = custom[a];
    if (code) km[code] = a;
  }
  return km;
}

/** Monta o mapa de botões: um botão escolhido substitui os padrões da ação e sai das outras. */
export function buildPadmap(custom: Partial<Record<Action, number>>): PadMap {
  const pm: PadMap = Object.fromEntries(ACTIONS.map((a) => [a, [...DEFAULT_PADMAP[a]]])) as PadMap;
  for (const a of REMAPPABLE) {
    const b = custom[a];
    if (b === undefined) continue;
    for (const other of ACTIONS) pm[other] = pm[other].filter((x) => x !== b);
    pm[a] = [b];
  }
  return pm;
}

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
  padmap: PadMap = buildPadmap({});
  /** última tecla apertada (para a tela de remapeamento) */
  lastKey: string | null = null;
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
      if (!e.repeat) this.lastKey = e.code;
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
      if (ax < -0.5) m |= ACTION_BIT.left;
      if (ax > 0.5) m |= ACTION_BIT.right;
      if (ay < -0.5) m |= ACTION_BIT.up;
      if (ay > 0.5) m |= ACTION_BIT.down;
      for (const a of ACTIONS) if (this.padmap[a].some(b)) m |= ACTION_BIT[a];
      if (m) this.anyGamepadActivity = true;
      mask |= m;
    }
    return mask;
  }

  /** Aplica as escolhas do jogador. */
  applyBindings(keys: Partial<Record<Action, string>>, pad: Partial<Record<Action, number>>): void {
    this.keymap = buildKeymap(keys);
    this.padmap = buildPadmap(pad);
  }

  /** Botões de controle apertados agora (para a tela de remapeamento). */
  padButtonsDown(): number[] {
    const out: number[] = [];
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) if (gp) gp.buttons.forEach((bt, i) => { if (bt.pressed && i < 12) out.push(i); });
    return out;
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
