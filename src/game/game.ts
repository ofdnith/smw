/** Núcleo do jogo: pilha de cenas, transições, save e configurações. */
import { Renderer, VIEW_W, VIEW_H } from '../engine/renderer';
import { Input } from '../engine/input';
import { GameLoop } from '../engine/loop';
import { synth } from '../engine/audio/synth';
import { sequencer } from '../engine/audio/sequencer';
import { loadSaveFile, storeSaveFile, newSlot, type SaveFile, type SaveSlot } from '../engine/save';
import { bindInput } from './entities/player';

export interface Scene {
  update(game: Game): void;
  draw(r: Renderer, alpha: number, game: Game): void;
  /** cena por baixo continua visível? */
  readonly transparent?: boolean;
  onEnter?(game: Game): void;
  onExit?(game: Game): void;
}

type Transition = { kind: 'iris' | 'fade'; t: number; dur: number; out: boolean; cx: number; cy: number; next?: () => void };

export class Game {
  renderer: Renderer;
  input: Input;
  loop: GameLoop;
  scenes: Scene[] = [];
  save: SaveFile;
  slotIndex = 0;
  transition: Transition | null = null;
  frame = 0;
  /** modo de depuração (F1) */
  debug = false;
  /** semente de replay / testes */
  seed = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    bindInput(this.input.state);
    this.save = loadSaveFile();
    this.applySettings();
    this.loop = new GameLoop({ update: () => this.update(), render: (a) => this.render(a) });
  }

  get slot(): SaveSlot {
    let s = this.save.slots[this.slotIndex];
    if (!s) {
      s = newSlot();
      this.save.slots[this.slotIndex] = s;
    }
    return s;
  }

  persist(): void {
    storeSaveFile(this.save);
  }

  applySettings(): void {
    synth.setMusicVolume(this.save.settings.music / 10);
    synth.setSfxVolume(this.save.settings.sfx / 10);
    const touch = document.getElementById('touch');
    if (touch) touch.classList.toggle('on', this.save.settings.touch);
  }

  start(): void {
    this.loop.start();
  }

  push(s: Scene): void {
    this.scenes.push(s);
    s.onEnter?.(this);
  }
  pop(): void {
    const s = this.scenes.pop();
    s?.onExit?.(this);
  }
  replace(s: Scene): void {
    while (this.scenes.length) this.pop();
    this.push(s);
  }
  get top(): Scene | undefined {
    return this.scenes[this.scenes.length - 1];
  }

  /** Transição: fecha, troca de cena via callback, abre. */
  transitionTo(next: () => void, kind: 'iris' | 'fade' = 'fade', cx = VIEW_W / 2, cy = VIEW_H / 2, dur = 24): void {
    if (this.transition && this.transition.out) return;
    this.transition = { kind, t: 0, dur, out: true, cx, cy, next };
  }

  update(): void {
    this.frame++;
    this.input.poll();
    if (this.transition) {
      const tr = this.transition;
      tr.t++;
      if (tr.t >= tr.dur) {
        if (tr.out) {
          tr.next?.();
          tr.out = false;
          tr.t = 0;
          tr.cx = VIEW_W / 2;
          tr.cy = VIEW_H / 2;
        } else {
          this.transition = null;
        }
      }
      if (tr.out) return; // congela durante a saída
    }
    this.top?.update(this);
    // música pausada quando a aba perde foco não é problema: o sequenciador usa o relógio de áudio
    if (this.frame % 600 === 0) this.persist();
  }

  render(alpha: number): void {
    const r = this.renderer;
    // encontra a primeira cena opaca de baixo para cima
    let start = this.scenes.length - 1;
    while (start > 0 && this.scenes[start].transparent) start--;
    for (let i = start; i < this.scenes.length; i++) this.scenes[i].draw(r, alpha, this);
    if (this.transition) {
      const tr = this.transition;
      const k = tr.out ? tr.t / tr.dur : 1 - tr.t / tr.dur;
      if (tr.kind === 'fade') r.dim(k);
      else {
        const maxR = Math.hypot(VIEW_W, VIEW_H) * 0.6;
        r.iris(tr.cx, tr.cy, (1 - k) * maxR);
      }
    }
    r.present();
  }

  stopMusic(): void {
    sequencer.stop(0.3);
  }
}
