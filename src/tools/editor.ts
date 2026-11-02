/**
 * Editor de fases no navegador: ?editor (sala vazia) ou ?editor=1-1 (abre a primeira sala de uma fase).
 *
 * Mouse: botão esquerdo pinta, direito apaga, roda rola. Teclado:
 *   setas/WASD rolam · Q/E trocam de peça · TAB troca de categoria · M troca o tema
 *   [ ] largura · - = altura · T testa do início · Y testa a partir do cursor
 *   P exporta (baixa JSON e copia as linhas) · N limpa · G liga/desliga a grade · ESC volta ao menu
 * O rascunho fica salvo no navegador.
 */
import { Renderer, VIEW_W, VIEW_H } from '../engine/renderer';
import type { SpriteDef } from '../engine/sprites';
import { getSprite } from '../engine/sprites';
import type { Game, Scene } from '../game/game';
import { TILE_CHARS, T, TILE, isSolid, isSlope } from '../game/level/tiles';
import { ENTITY_CHARS, parseRoom, type LevelDef, type Theme } from '../game/level/format';
import { tileFrame } from '../content/art/tilesets';
import { drawBackground } from '../game/render/backgrounds';
import { LUMI, LUMI_PALETTE } from '../content/art/lumi';
import { BOLOTA } from '../content/art/bolota';
import { ITEMS, GHOST, BELL, SIGN, GOAL_ARCH } from '../content/art/items';
import { ENEMIES } from '../content/art/enemies';
import { OBJECTS } from '../content/art/objects';
import { LEVELS } from '../content/levels';
import { LevelScene } from '../game/scenes/level';

const THEMES_LIST: Theme[] = ['praia', 'bosque', 'penhasco', 'recife', 'minas', 'vale', 'farol', 'ceu', 'forte', 'navio'];
const MUSIC_BY_THEME: Record<Theme, string> = {
  praia: 'praia', bosque: 'bosque', penhasco: 'penhasco', recife: 'recife', minas: 'minas', vale: 'vale', farol: 'farol', ceu: 'ceu', forte: 'forte', navio: 'navio',
};

export const PALETTE: { name: string; chars: string }[] = [
  { name: 'TERRENO', chars: '#%=_BIF><^' },
  { name: 'BLOCOS', chars: '?!H+0857' },
  { name: 'RAMPAS', chars: '/\\{}[]' },
  { name: 'AGUA/AR', chars: '~W"|V&X$:;' },
  { name: 'LUMI E ITENS', chars: 'scgklph9e@d' },
  { name: 'INIMIGOS', chars: 'rvunfoijªtbw°' },
  { name: 'OBJETOS', chars: 'mqzyxç6¬a' },
  { name: 'PORTAS', chars: '1234*' },
];

const BLOCK_TILE: Record<string, T> = { '+': T.ItemPower, '0': T.ItemPower, '8': T.ItemPower, '5': T.ItemPower, '7': T.ItemAmber };

const lumiIdle: SpriteDef = { palette: LUMI_PALETTE, frames: [LUMI.idle[0]] };
const ENTITY_SPRITE: Record<string, SpriteDef | undefined> = {
  start: lumiIdle, checkpoint: BELL, goal: GOAL_ARCH, secretGoal: OBJECTS.door, key: ITEMS.key, lock: ITEMS.lock, pearl: ITEMS.pearl,
  feather: ITEMS.feather, bolota: BOLOTA.normal, sign: SIGN, ghost: GHOST,
  crab: ENEMIES.crab, gull: ENEMIES.gull, urchin: ENEMIES.urchin, slug: ENEMIES.slug, puppet: ENEMIES.puppet, octopus: ENEMIES.octopus,
  kite: ENEMIES.kite, jelly: ENEMIES.jelly, fish: ENEMIES.fish, mole: ENEMIES.mole, bat: ENEMIES.bat, sailor: ENEMIES.sailor, flame: ENEMIES.flame,
  platformH: OBJECTS.platform, platformV: OBJECTS.platform, fallPlat: OBJECTS.fallPlatform, spring: OBJECTS.spring, cannon: OBJECTS.cannon,
  cannonL: OBJECTS.cannon, swing: OBJECTS.knot, sawblade: OBJECTS.saw, minecart: OBJECTS.minecart,
};

/** Nome curto de uma peça para a barra de status. */
export function pieceName(ch: string): string {
  if (ch in BLOCK_TILE) return { '+': 'BAU: FOLHA', '0': 'BAU: LANTERNA', '8': 'BAU: CONCHA', '5': 'BAU: PENA', '7': 'BAU: PEROLA' }[ch] ?? ch;
  const kind = ENTITY_CHARS[ch];
  if (kind) return kind.toUpperCase();
  const t = TILE_CHARS[ch];
  if (t !== undefined) return T[t].toUpperCase();
  if (ch >= '1' && ch <= '4') return 'PORTA ' + ch;
  return ch;
}

export interface Draft { name: string; theme: Theme; rows: string[] }

const STORE_KEY = 'lumi.editor.draft';

export function blankDraft(w = 120, h = 14): Draft {
  const rows: string[] = [];
  for (let y = 0; y < h; y++) rows.push((y >= h - 3 ? '#' : '.').repeat(w));
  rows[h - 4] = '...s' + '.'.repeat(w - 4);
  rows[h - 4] = rows[h - 4].slice(0, w - 6) + 'g' + rows[h - 4].slice(w - 5);
  return { name: 'MINHA FASE', theme: 'praia', rows };
}

/** Constrói uma LevelDef jogável a partir do rascunho (opcionalmente com início numa posição). */
export function draftToLevel(d: Draft, startAt?: { tx: number; ty: number }): LevelDef {
  let rows = d.rows;
  if (startAt) {
    rows = rows.map((r) => r.replace(/s/g, '.'));
    const r = rows[startAt.ty].split('');
    r[startAt.tx] = 's';
    rows[startAt.ty] = r.join('');
  }
  return { id: 'EDITOR', name: d.name, island: 1, theme: d.theme, music: MUSIC_BY_THEME[d.theme], kind: 'normal', rooms: [{ map: rows }] };
}

/** Problemas que impedem testar. */
export function draftProblems(d: Draft): string[] {
  const out: string[] = [];
  const all = d.rows.join('');
  if (!all.includes('s')) out.push('FALTA O INICIO (S)');
  if (!all.includes('g') && !all.includes('*')) out.push('FALTA O ARCO DE CHEGADA (G)');
  try { parseRoom({ map: d.rows }, 0, d.theme); } catch (e) { out.push(String((e as Error).message).toUpperCase().slice(0, 50)); }
  return out;
}

export class EditorScene implements Scene {
  draft: Draft;
  cat = 0;
  idx = 0;
  camX = 0;
  camY = 0;
  t = 0;
  grid = true;
  mouse = { x: -1, y: -1, left: false, right: false, inside: false };
  message = '';
  messageT = 0;
  private game: Game | null = null;
  private keys = new Set<string>();
  private cleanup: (() => void)[] = [];

  constructor(levelId?: string) {
    const stored = levelId ? null : loadDraft();
    if (levelId && LEVELS[levelId]) {
      const lv = LEVELS[levelId];
      const room = lv.rooms[0];
      const rows = room.map.filter((r) => r.length > 0);
      const w = Math.max(...rows.map((r) => r.length));
      this.draft = { name: lv.name, theme: room.theme ?? lv.theme, rows: rows.map((r) => r.padEnd(w, '.')) };
    } else this.draft = stored ?? blankDraft();
    // começa mostrando o chão (embaixo), acima da paleta
    this.camY = Math.max(-32, this.h * TILE - (VIEW_H - 24) + 4);
  }

  get w(): number { return this.draft.rows[0].length; }
  get h(): number { return this.draft.rows.length; }
  get piece(): string { return PALETTE[this.cat].chars[this.idx] ?? '.'; }

  onEnter(game: Game): void {
    // chamado de novo ao voltar de um teste: refaz os ouvintes sem duplicar
    for (const f of this.cleanup) f();
    this.cleanup = [];
    this.game = game;
    const canvas = document.getElementById('game') as HTMLCanvasElement | null;
    if (!canvas) return;
    const pos = (e: MouseEvent): void => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * VIEW_W;
      this.mouse.y = ((e.clientY - r.top) / r.height) * VIEW_H;
      this.mouse.inside = this.mouse.x >= 0 && this.mouse.y >= 0 && this.mouse.x < VIEW_W && this.mouse.y < VIEW_H;
    };
    const down = (e: MouseEvent): void => {
      pos(e);
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this.mouse.right = true;
      this.clickPalette();
    };
    const up = (e: MouseEvent): void => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    };
    const wheel = (e: WheelEvent): void => {
      e.preventDefault();
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) this.camX += (e.deltaX || e.deltaY) * 0.5;
      else this.camY += e.deltaY * 0.5;
    };
    const ctx = (e: Event): void => e.preventDefault();
    const kd = (e: KeyboardEvent): void => { this.keys.add(e.code); this.onKey(e); };
    const ku = (e: KeyboardEvent): void => { this.keys.delete(e.code); };
    canvas.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', pos);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('contextmenu', ctx);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    this.cleanup = [
      () => canvas.removeEventListener('mousedown', down), () => window.removeEventListener('mouseup', up),
      () => window.removeEventListener('mousemove', pos), () => canvas.removeEventListener('wheel', wheel),
      () => canvas.removeEventListener('contextmenu', ctx), () => window.removeEventListener('keydown', kd),
      () => window.removeEventListener('keyup', ku),
    ];
    this.say('EDITOR: T TESTA, P EXPORTA');
  }

  onExit(): void {
    for (const f of this.cleanup) f();
    this.cleanup = [];
  }

  /** Só reage a teclas quando o editor está no topo (não durante o teste). */
  private active(): boolean {
    return !!this.game && this.game.top === this;
  }

  private say(msg: string): void {
    this.message = msg;
    this.messageT = 150;
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.active()) return;
    const n = PALETTE[this.cat].chars.length;
    switch (e.code) {
      case 'KeyQ': this.idx = (this.idx + n - 1) % n; break;
      case 'KeyE': this.idx = (this.idx + 1) % n; break;
      case 'Tab': e.preventDefault(); this.cat = (this.cat + 1) % PALETTE.length; this.idx = 0; break;
      case 'KeyM': this.draft.theme = THEMES_LIST[(THEMES_LIST.indexOf(this.draft.theme) + 1) % THEMES_LIST.length]; this.say('TEMA ' + this.draft.theme.toUpperCase()); break;
      case 'BracketRight': this.resize(this.w + 8, this.h); break;
      case 'BracketLeft': this.resize(Math.max(20, this.w - 8), this.h); break;
      case 'Equal': this.resize(this.w, Math.min(60, this.h + 1)); break;
      case 'Minus': this.resize(this.w, Math.max(12, this.h - 1)); break;
      case 'KeyG': this.grid = !this.grid; break;
      case 'KeyN': this.draft = blankDraft(); this.say('FASE NOVA'); break;
      case 'KeyT': this.test(); break;
      case 'KeyY': this.test(this.cursorTile()); break;
      case 'KeyP': this.export(); break;
      case 'Escape':
        // aberto pelo menu de Extras: volta para ele
        if (this.game && this.game.scenes.length > 1) { saveDraft(this.draft); const g = this.game; g.transitionTo(() => g.pop(), 'fade'); }
        return;
      default: return;
    }
    saveDraft(this.draft);
  }

  /** Redimensiona mantendo o chão alinhado embaixo. */
  resize(w: number, h: number): void {
    let rows = this.draft.rows.map((r) => (r.length >= w ? r.slice(0, w) : r + (r[r.length - 1] === '#' ? '#' : '.').repeat(w - r.length)));
    while (rows.length < h) rows = ['.'.repeat(w), ...rows];
    while (rows.length > h) rows = rows.slice(1);
    this.draft.rows = rows;
    this.say(`${w} X ${h}`);
  }

  cursorTile(): { tx: number; ty: number } | undefined {
    if (!this.mouse.inside || this.mouse.y >= VIEW_H - 24) return undefined;
    const tx = Math.floor((this.mouse.x + this.camX) / TILE), ty = Math.floor((this.mouse.y + this.camY) / TILE);
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return undefined;
    return { tx, ty };
  }

  set(tx: number, ty: number, ch: string): void {
    const row = this.draft.rows[ty];
    if (row[tx] === ch) return;
    // início, chegada e chefe são únicos
    if (ch === 's' || ch === '*') this.draft.rows = this.draft.rows.map((r) => r.split(ch).join('.'));
    const r = this.draft.rows[ty].split('');
    r[tx] = ch;
    this.draft.rows[ty] = r.join('');
  }

  private clickPalette(): void {
    if (!this.mouse.left || this.mouse.y < VIEW_H - 24) return;
    const chars = PALETTE[this.cat].chars;
    if (this.mouse.y < VIEW_H - 22 + 8 && this.mouse.x > VIEW_W - 60) { this.cat = (this.cat + 1) % PALETTE.length; this.idx = 0; return; }
    const i = Math.floor((this.mouse.x - 4) / 18);
    if (i >= 0 && i < chars.length) this.idx = i;
  }

  test(at?: { tx: number; ty: number }): void {
    const game = this.game;
    if (!game) return;
    const probs = draftProblems(this.draft).filter((p) => !(at && p.includes('INICIO')));
    if (probs.length) { this.say(probs[0]); return; }
    saveDraft(this.draft);
    const lvl = draftToLevel(this.draft, at);
    game.transitionTo(() => game.push(new LevelScene(lvl, game, null, { timeAttack: true })), 'fade');
  }

  export(): void {
    const json = JSON.stringify({ name: this.draft.name, theme: this.draft.theme, rows: this.draft.rows }, null, 2);
    const ts = `rooms: [{ map: [\n${this.draft.rows.map((r) => `  ${JSON.stringify(r)},`).join('\n')}\n] }],`;
    try { void navigator.clipboard?.writeText(ts); } catch { /* sem permissão */ }
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = 'fase.json';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* ambiente sem download */ }
    this.say('EXPORTADO: FASE.JSON E LINHAS COPIADAS');
  }

  update(): void {
    this.t++;
    if (this.messageT > 0) this.messageT--;
    if (!this.active()) return;
    const sp = this.keys.has('ShiftLeft') ? 8 : 4;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) this.camX -= sp;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) this.camX += sp;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) this.camY -= sp;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) this.camY += sp;
    this.camX = Math.max(-32, Math.min(this.w * TILE - VIEW_W + 32, this.camX));
    this.camY = Math.max(-32, Math.min(Math.max(-32, this.h * TILE - VIEW_H + 56), this.camY));
    const c = this.cursorTile();
    if (c && (this.mouse.left || this.mouse.right)) {
      this.set(c.tx, c.ty, this.mouse.right ? '.' : this.piece);
      if (this.t % 30 === 0) saveDraft(this.draft);
    }
  }

  draw(r: Renderer): void {
    const camX = Math.round(this.camX), camY = Math.round(this.camY);
    r.camX = camX;
    r.camY = camY;
    r.shakeX = 0;
    r.shakeY = 0;
    drawBackground(r, this.draft.theme, camX, camY, { frame: this.t });
    const rows = this.draft.rows;
    const tile = (x: number, y: number): T => {
      if (y < 0 || y >= this.h || x < 0 || x >= this.w) return T.Empty;
      const ch = rows[y][x];
      return BLOCK_TILE[ch] ?? TILE_CHARS[ch] ?? T.Empty;
    };
    const tx0 = Math.max(0, Math.floor(camX / TILE)), tx1 = Math.min(this.w, Math.ceil((camX + VIEW_W) / TILE) + 1);
    const ty0 = Math.max(0, Math.floor(camY / TILE)), ty1 = Math.min(this.h, Math.ceil((camY + VIEW_H) / TILE) + 1);
    const anim = Math.floor(this.t / 8);
    for (let ty = ty0; ty < ty1; ty++) {
      for (let tx = tx0; tx < tx1; tx++) {
        const ch = rows[ty][tx];
        const t = tile(tx, ty);
        if (t !== T.Empty && t !== T.BossMarker && !(t >= T.Door1 && t <= T.Door4)) {
          let mask = 0;
          if (t === T.Solid || t === T.Rock || t === T.Ice) {
            const n = (x: number, y: number): boolean => {
              if (x < 0 || x >= this.w || y >= this.h) return true;
              if (y < 0) return false;
              const tt = tile(x, y);
              return isSolid(tt) || isSlope(tt);
            };
            mask = (n(tx, ty - 1) ? 1 : 0) | (n(tx + 1, ty) ? 2 : 0) | (n(tx, ty + 1) ? 4 : 0) | (n(tx - 1, ty) ? 8 : 0);
          }
          const f = tileFrame(this.draft.theme, t === T.Hidden ? T.ItemAmber : t, mask, tx, ty, anim);
          if (f) {
            if (t === T.Hidden || t === T.Water || t === T.WaterTop) r.ctx.globalAlpha = 0.5;
            r.drawFrame(f, tx * TILE, ty * TILE);
            r.ctx.globalAlpha = 1;
          }
        }
        this.drawPiece(r, ch, tx * TILE, ty * TILE, true);
      }
    }
    // bordas e grade
    if (this.grid) {
      r.ctx.globalAlpha = 0.12;
      for (let tx = tx0; tx <= tx1; tx++) r.fillRect(tx * TILE, ty0 * TILE, 1, (ty1 - ty0) * TILE, '#ffffff', true);
      for (let ty = ty0; ty <= ty1; ty++) r.fillRect(tx0 * TILE, ty * TILE, (tx1 - tx0) * TILE, 1, '#ffffff', true);
      r.ctx.globalAlpha = 1;
    }
    r.fillRect(-2, -2, 2, this.h * TILE + 4, '#ff5a5a', true);
    r.fillRect(this.w * TILE, -2, 2, this.h * TILE + 4, '#ff5a5a', true);
    r.fillRect(0, this.h * TILE, this.w * TILE, 2, '#ff5a5a', true);
    // cursor
    const c = this.cursorTile();
    if (c) {
      r.ctx.globalAlpha = 0.5;
      this.drawPiece(r, this.piece, c.tx * TILE, c.ty * TILE, true);
      r.ctx.globalAlpha = 1;
      r.ctx.strokeStyle = '#ffd24a';
      r.ctx.strokeRect(c.tx * TILE - camX + 0.5, c.ty * TILE - camY + 0.5, TILE - 1, TILE - 1);
    }
    // barra superior
    r.fillRect(0, 0, VIEW_W, 10, 'rgba(0,0,0,0.6)');
    r.text(`${this.draft.name}  ${this.w}X${this.h}  ${this.draft.theme.toUpperCase()}${c ? `  ${c.tx},${c.ty}` : ''}`, 3, 2, '#ffffff');
    r.text(pieceName(this.piece), VIEW_W - 3, 2, '#ffd24a', 'right');
    // paleta
    r.fillRect(0, VIEW_H - 24, VIEW_W, 24, 'rgba(8,14,28,0.92)');
    const chars = PALETTE[this.cat].chars;
    for (let i = 0; i < chars.length; i++) {
      const x = 4 + i * 18, y = VIEW_H - 21;
      r.fillRect(x - 1, y - 1, 18, 18, i === this.idx ? '#ffd24a' : '#2a3a5a');
      r.fillRect(x, y, 16, 16, '#101a2e');
      const ch = chars[i];
      const t = BLOCK_TILE[ch] ?? TILE_CHARS[ch];
      if (t !== undefined && t !== T.Empty && t !== T.BossMarker && !(t >= T.Door1 && t <= T.Door4)) {
        const f = tileFrame(this.draft.theme, t === T.Hidden ? T.ItemAmber : t, 15, 0, 0, anim);
        if (f) r.drawFrame(f, x, y, false);
      }
      this.drawPiece(r, ch, x, y, false);
    }
    r.text(PALETTE[this.cat].name, VIEW_W - 4, VIEW_H - 22, '#9fb3c8', 'right');
    r.text('TAB', VIEW_W - 4, VIEW_H - 12, '#5a6a8a', 'right');
    if (this.messageT > 0) {
      r.box(VIEW_W / 2 - 100, 14, 200, 14);
      r.text(this.message, VIEW_W / 2, 18, '#ffffff', 'center');
    }
  }

  /** Desenha entidades/portas/marcas de uma célula (tiles já foram desenhados). */
  private drawPiece(r: Renderer, ch: string, x: number, y: number, world: boolean): void {
    const kind = ENTITY_CHARS[ch];
    const def = kind ? ENTITY_SPRITE[kind] : undefined;
    if (def) {
      const f = getSprite(def, kind === 'cannonL').frames[0];
      const scale = !world && (f.w > 16 || f.h > 16) ? 16 / Math.max(f.w, f.h) : 1;
      if (scale < 1) r.drawFrameScaled(f, x + (16 - f.w * scale) / 2, y + 16 - f.h * scale, scale, scale, false);
      else r.drawFrame({ ...f, ox: 0, oy: 0 }, x + 8 - f.w / 2, y + 16 - f.h, world);
      return;
    }
    if ((ch >= '1' && ch <= '4') || ch === '*' || ch === '"' || ch === '9') {
      r.fillRect(x + 2, y + 2, 12, 12, ch === '*' ? '#e85d4a' : ch === '"' ? 'rgba(160,220,255,0.4)' : '#8a6a3a', world);
      const ox = world ? r.camX : 0, oy = world ? r.camY : 0;
      r.text(ch === '*' ? 'B' : ch === '"' ? 'A' : ch === '9' ? 'S' : ch, x + 5 - ox, y + 5 - oy, '#ffffff', 'left');
    }
    if (ch in BLOCK_TILE) {
      const spr = { '+': ITEMS.leaf, '0': ITEMS.lantern, '8': ITEMS.shell, '5': ITEMS.feather, '7': ITEMS.pearl }[ch];
      if (spr) {
        const f = getSprite(spr, false).frames[0];
        r.ctx.globalAlpha = 0.85;
        r.drawFrameScaled(f, x + 4 - (world ? r.camX : 0), y + 4 - (world ? r.camY : 0), 0.5, 0.5, false);
        r.ctx.globalAlpha = 1;
      }
    }
  }
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (!Array.isArray(d.rows) || !d.rows.length) return null;
    return d;
  } catch {
    return null;
  }
}
function saveDraft(d: Draft): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch { /* modo privado */ }
}
