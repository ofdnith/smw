/** Opções: volumes, acessibilidade, controles na tela e remapeamento de teclas e botões. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import type { Game, Scene } from '../game';
import { REMAPPABLE, keyLabel, type Action } from '../../engine/input';
import { drawBackground } from '../render/backgrounds';

const ACTION_NAMES: Record<Action, string> = {
  left: 'ESQUERDA', right: 'DIREITA', up: 'CIMA', down: 'BAIXO',
  jump: 'PULO', run: 'CORRER / PEGAR', spin: 'CAMBALHOTA', item: 'ITEM GUARDADO', pause: 'PAUSA',
};

type Row =
  | { id: 'music' | 'sfx' | 'assist' | 'touch' | 'reset' | 'back' }
  | { id: 'key'; action: Action };

export class OptionsScene implements Scene {
  index = 0;
  t = 0;
  /** aguardando uma tecla/botão para esta ação */
  listening: Action | null = null;
  listenT = 0;
  private padBefore = new Set<number>();
  readonly rows: Row[] = [
    { id: 'music' }, { id: 'sfx' }, { id: 'assist' }, { id: 'touch' },
    ...REMAPPABLE.map((action) => ({ id: 'key' as const, action })),
    { id: 'reset' }, { id: 'back' },
  ];
  /** fundo transparente quando aberto por cima da pausa */
  constructor(readonly overlay = false) {}
  get transparent(): boolean { return this.overlay; }

  update(game: Game): void {
    this.t++;
    const s = game.save.settings;
    const input = game.input;
    if (this.listening) {
      this.listenT++;
      const a = this.listening;
      // tecla
      if (input.lastKey && this.listenT > 2) {
        const code = input.lastKey;
        if (code === 'Escape') { this.listening = null; sfx('menu'); return; }
        for (const other of REMAPPABLE) if (other !== a && s.keys[other] === code) delete s.keys[other];
        s.keys[a] = code;
        this.finishListen(game);
        return;
      }
      // botão de controle (só botões recém-apertados)
      const down = input.padButtonsDown();
      const fresh = down.find((b) => !this.padBefore.has(b));
      if (fresh !== undefined && this.listenT > 2) {
        for (const other of REMAPPABLE) if (other !== a && s.pad[other] === fresh) delete s.pad[other];
        s.pad[a] = fresh;
        this.finishListen(game);
        return;
      }
      this.padBefore = new Set(down);
      if (this.listenT > 600) { this.listening = null; sfx('menu'); }
      return;
    }
    const inp = input.state;
    const n = this.rows.length;
    if (inp.isPressed('down')) { this.index = (this.index + 1) % n; sfx('menu'); }
    if (inp.isPressed('up')) { this.index = (this.index + n - 1) % n; sfx('menu'); }
    const row = this.rows[this.index];
    const dx = (inp.isPressed('right') ? 1 : 0) - (inp.isPressed('left') ? 1 : 0);
    if (row.id === 'music' && dx) { s.music = Math.max(0, Math.min(10, s.music + dx)); game.applySettings(); sfx('menu'); game.persist(); }
    if (row.id === 'sfx' && dx) { s.sfx = Math.max(0, Math.min(10, s.sfx + dx)); game.applySettings(); sfx('menu'); game.persist(); }
    if (inp.isPressed('spin') || inp.isPressed('pause')) { this.close(game); return; }
    if (inp.isPressed('jump') || inp.isPressed('run')) {
      switch (row.id) {
        case 'assist': s.assist = !s.assist; sfx('select'); break;
        case 'touch': s.touch = !s.touch; game.applySettings(); sfx('select'); break;
        case 'key':
          this.listening = row.action;
          this.listenT = 0;
          input.lastKey = null;
          this.padBefore = new Set(input.padButtonsDown());
          sfx('select');
          break;
        case 'reset': s.keys = {}; s.pad = {}; game.applySettings(); sfx('select'); break;
        case 'back': this.close(game); return;
        default: break;
      }
      game.persist();
    }
  }

  private finishListen(game: Game): void {
    this.listening = null;
    game.applySettings();
    game.persist();
    game.input.lastKey = null;
    // evita que a tecla recém-escolhida dispare uma ação no menu
    game.input.state.prevHeld = 0xffff;
    game.input.state.held = 0xffff;
    sfx('select');
  }

  private close(game: Game): void {
    sfx('menu');
    game.persist();
    if (this.overlay) game.pop();
    else game.transitionTo(() => game.pop(), 'fade');
  }

  draw(r: Renderer, _a: number, game: Game): void {
    r.camX = 0;
    r.camY = 0;
    if (this.overlay) r.dim(0.75, '#050a18');
    else drawBackground(r, 'praia', this.t * 0.3, 0, { frame: this.t, night: true });
    const s = game.save.settings;
    r.box(12, 8, VIEW_W - 24, VIEW_H - 16, 'rgba(10,20,40,0.92)');
    r.text('OPCOES', VIEW_W / 2, 16, '#ffd24a', 'center');
    this.rows.forEach((row, i) => {
      const y = 34 + i * 13;
      const sel = i === this.index;
      const col = sel ? '#ffffff' : '#c9ccd6';
      let left = '';
      let right = '';
      switch (row.id) {
        case 'music': left = 'MUSICA'; right = '●'.repeat(s.music) + '.'.repeat(10 - s.music); break;
        case 'sfx': left = 'EFEITOS'; right = '●'.repeat(s.sfx) + '.'.repeat(10 - s.sfx); break;
        case 'assist': left = 'MODO ASSISTIDO'; right = s.assist ? 'SIM' : 'NAO'; break;
        case 'touch': left = 'CONTROLES NA TELA'; right = s.touch ? 'SIM' : 'NAO'; break;
        case 'key': {
          left = ACTION_NAMES[row.action];
          if (this.listening === row.action) right = Math.floor(this.t / 15) % 2 ? 'APERTE...' : '';
          else {
            const k = keyLabel(s.keys[row.action] ?? defaultKey(row.action));
            const p = s.pad[row.action];
            right = p !== undefined ? `${k} / BOTAO ${p}` : k;
          }
          break;
        }
        case 'reset': left = 'RESTAURAR CONTROLES'; break;
        case 'back': left = 'VOLTAR'; break;
      }
      r.text((sel ? '> ' : '  ') + left, 18, y, col);
      if (right) r.text(right, VIEW_W - 20, y, row.id === 'key' ? '#ffd24a' : col, 'right');
    });
    const hint = this.listening ? 'APERTE TECLA OU BOTAO (ESC SAI)' : 'Z: OK  SETAS: AJUSTAR  C: VOLTAR';
    r.text(hint, VIEW_W / 2, VIEW_H - 22, 'rgba(255,255,255,0.65)', 'center');
  }
}

function defaultKey(a: Action): string {
  return ({ jump: 'KeyZ', run: 'KeyX', spin: 'KeyC', item: 'KeyV', pause: 'Enter' } as Partial<Record<Action, string>>)[a] ?? '';
}
