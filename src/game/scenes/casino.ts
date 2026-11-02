/**
 * Cassino de Conchas: jogo da memória com 12 conchas viradas (6 pares).
 * Cada rodada custa 10 âmbar. Errar 4 vezes encerra a rodada; cada par achado vira prêmio.
 */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { Rng } from '../../engine/rng';
import type { Game, Scene } from '../game';
import { ITEMS } from '../../content/art/items';

export const CASINO_COST = 10;
export const CASINO_MISSES = 4;
const COLS = 6;
const ROWS = 2;
const PRIZES = ['feather', 'amber', 'shell', 'leaf', 'lantern', 'pearl'] as const;
type Prize = (typeof PRIZES)[number];

/** Embaralha 6 pares de prêmios de forma determinística a partir da semente. */
export function dealCards(seed: number): Prize[] {
  const rng = new Rng(seed);
  const cards: Prize[] = [...PRIZES, ...PRIZES];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

type Phase = 'intro' | 'play' | 'reveal' | 'done' | 'broke';

export class CasinoScene implements Scene {
  cards: Prize[];
  open: boolean[];
  matched: boolean[];
  cursor = 0;
  first = -1;
  second = -1;
  misses = 0;
  t = 0;
  phase: Phase = 'intro';
  won: Prize[] = [];
  message = '';

  constructor(seed: number) {
    this.cards = dealCards(seed);
    this.open = this.cards.map(() => false);
    this.matched = this.cards.map(() => false);
  }

  update(game: Game): void {
    this.t++;
    const inp = game.input.state;
    const slot = game.slot;
    const confirm = inp.isPressed('jump') || inp.isPressed('run');
    switch (this.phase) {
      case 'intro':
        if (confirm) {
          if (slot.amber < CASINO_COST) { this.phase = 'broke'; this.t = 0; sfx('hurt'); return; }
          slot.amber -= CASINO_COST;
          game.persist();
          sfx('select');
          // mostra tudo por um instante antes de virar
          this.open = this.cards.map(() => true);
          this.phase = 'reveal';
          this.t = 0;
        } else if (inp.isPressed('pause') || inp.isPressed('spin')) {
          game.transitionTo(() => game.pop(), 'fade');
        }
        return;
      case 'reveal':
        if (this.t > 75) { this.open = this.cards.map(() => false); this.phase = 'play'; this.t = 0; }
        return;
      case 'broke':
      case 'done':
        if (this.t > 40 && (confirm || inp.isPressed('pause'))) game.transitionTo(() => game.pop(), 'fade');
        return;
      case 'play':
        break;
    }
    // par aberto aguardando para fechar
    if (this.second >= 0) {
      if (this.t > 40) {
        const a = this.first, b = this.second;
        if (this.cards[a] === this.cards[b]) {
          this.matched[a] = this.matched[b] = true;
          this.won.push(this.cards[a]);
        } else {
          this.open[a] = this.open[b] = false;
          this.misses++;
        }
        this.first = this.second = -1;
        if (this.misses >= CASINO_MISSES || this.matched.every(Boolean)) this.finish(game);
      }
      return;
    }
    const col = this.cursor % COLS, row = Math.floor(this.cursor / COLS);
    if (inp.isPressed('left')) { this.cursor = row * COLS + ((col + COLS - 1) % COLS); sfx('menu'); }
    if (inp.isPressed('right')) { this.cursor = row * COLS + ((col + 1) % COLS); sfx('menu'); }
    if (inp.isPressed('up') || inp.isPressed('down')) { this.cursor = ((row + 1) % ROWS) * COLS + col; sfx('menu'); }
    if (confirm && !this.open[this.cursor]) {
      this.open[this.cursor] = true;
      sfx('item');
      if (this.first < 0) this.first = this.cursor;
      else {
        this.second = this.cursor;
        this.t = 0;
        sfx(this.cards[this.first] === this.cards[this.second] ? 'pearl' : 'pop');
      }
    }
  }

  private finish(game: Game): void {
    const slot = game.slot;
    for (const p of this.won) {
      if (p === 'feather') slot.lives = Math.min(99, slot.lives + 1);
      else if (p === 'pearl') slot.lives = Math.min(99, slot.lives + 2);
      else if (p === 'amber') {
        slot.amber += 15;
        while (slot.amber >= 100) { slot.amber -= 100; slot.lives = Math.min(99, slot.lives + 1); }
      } else if (slot.power === 'none') slot.power = p;
      else if (slot.reserve === 'none' || slot.reserve === 'shell') slot.reserve = p;
    }
    game.persist();
    this.phase = 'done';
    this.t = 0;
    this.open = this.cards.map(() => true);
    this.message = this.won.length === 0 ? 'A MARE NAO AJUDOU HOJE...' : this.won.length >= 6 ? 'TODOS OS PARES! QUE MEMORIA!' : `${this.won.length} PAR${this.won.length > 1 ? 'ES' : ''}! BOM PROVEITO.`;
    sfx(this.won.length ? 'powerup' : 'menu');
  }

  draw(r: Renderer, _alpha: number, game: Game): void {
    r.gradient([[0, '#0f2a4a'], [1, '#1f4f7a']]);
    // luzinhas do toldo
    for (let i = 0; i < 20; i++) r.fillRect(8 + i * 16, 4, 4, 4, (i + Math.floor(this.t / 15)) % 2 ? '#ffd24a' : '#e85d4a');
    r.text('CASSINO DE CONCHAS', VIEW_W / 2, 14, '#ffe0b0', 'center', '#000000');
    const slot = game.slot;
    r.drawSprite(ITEMS.amber, Math.floor(this.t / 8) % 4, 8, VIEW_H - 14, false, false);
    r.text(`${slot.amber}`, 20, VIEW_H - 12, '#ffffff');
    r.text(`x${slot.lives}`, VIEW_W - 30, VIEW_H - 12, '#ffffff');
    if (this.phase === 'intro' || this.phase === 'broke') {
      r.textBlock(
        this.phase === 'broke'
          ? ['FALTA AMBAR, MOCINHA.', `VOLTE COM ${CASINO_COST} GOTAS.`]
          : ['ACHE OS PARES DEBAIXO DAS CONCHAS.', `UMA RODADA CUSTA ${CASINO_COST} AMBAR.`, `ERROU ${CASINO_MISSES} VEZES, ACABOU.`, '', 'Z: JOGAR    C: SAIR'],
        VIEW_W / 2, 50, '#ffffff', '#000000', 11,
      );
      return;
    }
    const x0 = VIEW_W / 2 - (COLS * 40) / 2 + 4, y0 = 36;
    for (let i = 0; i < this.cards.length; i++) {
      const cx = x0 + (i % COLS) * 40, cy = y0 + Math.floor(i / COLS) * 46;
      const sel = i === this.cursor && this.phase === 'play';
      const bob = sel ? Math.round(Math.sin(this.t / 6)) : 0;
      r.box(cx, cy + bob, 32, 38, this.matched[i] ? '#2a5a3a' : sel ? '#3a4a6a' : '#1a2a44', sel ? '#ffd24a' : this.matched[i] ? '#8fd18f' : '#7a8aa8');
      if (this.open[i]) {
        const spr = ITEMS[this.cards[i]];
        if (spr) r.drawSprite(spr, 0, cx + 8, cy + 11 + bob, false, false);
      } else {
        r.drawSprite(ITEMS.shell, 0, cx + 8, cy + 11 + bob, false, false);
      }
    }
    // erros restantes
    for (let i = 0; i < CASINO_MISSES; i++) r.fillRect(VIEW_W / 2 - 22 + i * 12, y0 + 96, 8, 8, i < CASINO_MISSES - this.misses ? '#ffd24a' : '#3a3a4a');
    if (this.phase === 'done') {
      r.text(this.message, VIEW_W / 2, y0 + 112, '#ffd24a', 'center', '#000000');
      if (this.t > 40) r.text('APERTE UM BOTAO', VIEW_W / 2, y0 + 124, '#ffffff', 'center');
    }
  }
}
