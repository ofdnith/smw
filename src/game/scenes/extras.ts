/**
 * Extras, desbloqueados pelas pérolas do melhor arquivo:
 * Galeria (arte do jogo), Sala de Som (trilha e efeitos) e Contra-relógio (fases já concluídas).
 */
import { wrap } from '../entities/items';
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx, SFX } from '../../engine/audio/sfx';
import { sequencer } from '../../engine/audio/sequencer';
import type { Game, Scene } from '../game';
import type { SpriteDef } from '../../engine/sprites';
import { getSprite } from '../../engine/sprites';
import { drawBackground } from '../render/backgrounds';
import { MUSIC, TRACK_TITLES } from '../../content/music';
import { LEVEL_LIST, LEVELS } from '../../content/levels';
import { levelLabel } from '../level/format';
import { slotPearls, formatTime } from '../../engine/save';
import { LUMI, LUMI_PALETTE } from '../../content/art/lumi';
import { BOLOTA } from '../../content/art/bolota';
import { ITEMS, GHOST, BELL } from '../../content/art/items';
import { ENEMIES } from '../../content/art/enemies';
import { BOSSES } from '../../content/art/bosses';
import { ONDINA } from '../../content/art/npcs';
import { LevelScene } from './level';
import { EditorScene } from '../../tools/editor';

export const UNLOCK = { gallery: 10, sound: 25, timeAttack: 40 } as const;

/** Maior número de pérolas entre os três arquivos. */
export function bestPearls(game: Game): number {
  return Math.max(0, ...game.save.slots.map((s) => (s ? slotPearls(s) : 0)));
}

/** Fases concluídas em qualquer arquivo, na ordem do jogo. */
export function clearedAnywhere(game: Game): string[] {
  const set = new Set<string>();
  for (const s of game.save.slots) if (s) for (const id of s.cleared) set.add(id);
  return LEVEL_LIST.filter((l) => set.has(l.id)).map((l) => l.id);
}

function backdrop(r: Renderer, t: number, title: string): void {
  r.camX = 0;
  r.camY = 0;
  drawBackground(r, 'ceu', t * 0.2, 0, { frame: t, night: true });
  r.dim(0.35);
  r.text(title, VIEW_W / 2, 8, '#ffd24a', 'center', '#000000');
}

// ------------------------------------------------------------------ menu

export class ExtrasScene implements Scene {
  index = 0;
  t = 0;
  readonly items: { name: string; need: number; open: (game: Game) => Scene }[] = [
    { name: 'GALERIA', need: UNLOCK.gallery, open: () => new GalleryScene() },
    { name: 'SALA DE SOM', need: UNLOCK.sound, open: () => new SoundRoomScene() },
    { name: 'CONTRA-RELOGIO', need: UNLOCK.timeAttack, open: (g) => new TimeAttackScene(g) },
    { name: 'EDITOR DE FASES', need: 0, open: () => new EditorScene() },
  ];

  update(game: Game): void {
    this.t++;
    const inp = game.input.state;
    if (inp.isPressed('down')) { this.index = (this.index + 1) % this.items.length; sfx('menu'); }
    if (inp.isPressed('up')) { this.index = (this.index + this.items.length - 1) % this.items.length; sfx('menu'); }
    if (inp.isPressed('spin') || inp.isPressed('pause')) { sfx('menu'); game.transitionTo(() => game.pop(), 'fade'); return; }
    if (inp.isPressed('jump') || inp.isPressed('run')) {
      const it = this.items[this.index];
      if (bestPearls(game) < it.need) { sfx('hurt'); return; }
      sfx('select');
      game.transitionTo(() => game.push(it.open(game)), 'fade');
    }
  }

  draw(r: Renderer, _a: number, game: Game): void {
    backdrop(r, this.t, 'EXTRAS');
    const pearls = bestPearls(game);
    r.drawSprite(ITEMS.pearl, 0, VIEW_W / 2 - 30, 22, false, false);
    r.text(`${pearls} PEROLAS`, VIEW_W / 2 - 16, 24, '#dff6ff');
    this.items.forEach((it, i) => {
      const y = 40 + i * 30;
      const sel = i === this.index;
      const open = pearls >= it.need;
      r.box(VIEW_W / 2 - 104, y, 208, 26, sel ? '#1a2a4a' : 'rgba(10,20,40,0.8)', sel ? '#ffd24a' : '#5a6a8a');
      r.text(it.name, VIEW_W / 2 - 94, y + 5, open ? (sel ? '#ffffff' : '#c9ccd6') : '#6a7a8a');
      r.text(open ? 'ABERTO' : `PRECISA DE ${it.need} PEROLAS`, VIEW_W / 2 - 94, y + 15, open ? '#9cf29c' : '#ff9a8a');
    });
    r.text('Z: ABRIR   C: VOLTAR', VIEW_W / 2, VIEW_H - 12, 'rgba(255,255,255,0.6)', 'center');
  }
}

// ------------------------------------------------------------------ galeria

interface Entry { name: string; desc: string[]; def: SpriteDef }

const lumi = (frames: string[]): SpriteDef => ({ palette: LUMI_PALETTE, frames });

export const GALLERY: { title: string; entries: Entry[] }[] = [
  {
    title: 'PERSONAGENS',
    entries: [
      { name: 'LUMI', desc: ['APRENDIZ DE FAROLEIRA.', 'CAPA AMARELA, GORRO COM POMPOM.'], def: lumi(LUMI.idle) },
      { name: 'LUMI CORRENDO', desc: ['COM O IMPETO CHEIO,', 'NADA A SEGURA.'], def: lumi(LUMI.run) },
      { name: 'BOLOTA', desc: ['BESOURO RODA-RODA.', 'ROLA, QUEBRA BLOCOS, PULA DUAS VEZES.'], def: BOLOTA.normal },
      { name: 'BOLOTA PEDRA', desc: ['PESADA: ANDA NO', 'FUNDO DA AGUA.'], def: BOLOTA.pedra },
      { name: 'BOLOTA SEDA', desc: ['SOLTA FIO E', 'BALANCA EM GANCHOS.'], def: BOLOTA.seda },
      { name: 'DONA ONDINA', desc: ['A VELHA FAROLEIRA.', 'GUARDA CONCHAS NA TENDA.'], def: ONDINA },
      { name: 'FAROLEIRO-FANTASMA', desc: ['UM POR FAROL.', 'SABE ONDE ESTAO OS SEGREDOS.'], def: GHOST },
    ],
  },
  {
    title: 'ITENS',
    entries: [
      { name: 'CONCHA-ESCUDO', desc: ['AGUENTA UM GOLPE.'], def: ITEMS.shell },
      { name: 'FOLHA DE VENTO', desc: ['PLANAR, RAJADA E', 'VOO BAIXO COM IMPETO.'], def: ITEMS.leaf },
      { name: 'LANTERNA VIVA', desc: ['ORBES DE LUZ QUE REVELAM', 'BLOCOS E ATORDOAM INIMIGOS.'], def: ITEMS.lantern },
      { name: 'PENA DE GAIVOTA', desc: ['UMA VIDA A MAIS.'], def: ITEMS.feather },
      { name: 'PEROLA DA MARE', desc: ['TRES POR FASE,', 'BEM ESCONDIDAS.'], def: ITEMS.pearl },
      { name: 'GOTA DE AMBAR', desc: ['CEM GOTAS, UMA VIDA.'], def: ITEMS.amber },
      { name: 'CHAVE DE PEDRA', desc: ['ABRE A PORTA DA', 'SAIDA SECRETA.'], def: ITEMS.key },
      { name: 'SINO DE FAROL', desc: ['TOQUE PARA GUARDAR', 'O CAMINHO.'], def: BELL },
    ],
  },
  {
    title: 'INIMIGOS',
    entries: [
      { name: 'CARANGUEJO-ERMITAO', desc: ['PISADO, SE ESCONDE', 'NA CONCHA.'], def: ENEMIES.crab },
      { name: 'GAIVOTA-LADRA', desc: ['MERGULHA QUANDO', 'VOCE PASSA EMBAIXO.'], def: ENEMIES.gull },
      { name: 'OURICO-BOMBA', desc: ['ESPINHOS EM CIMA.', 'SO A CAMBALHOTA QUICA.'], def: ENEMIES.urchin },
      { name: 'LESMA-MUSGO', desc: ['ANDA EM QUALQUER', 'SUPERFICIE, ATE NO TETO.'], def: ENEMIES.slug },
      { name: 'FANTOCHE DE NEVOA', desc: ['APARECE QUANDO VOCE', 'VIRA DE COSTAS.'], def: ENEMIES.puppet },
      { name: 'POLVO-CANO', desc: ['COSPE TINTA EM ARCO.'], def: ENEMIES.octopus },
      { name: 'PIPA-ESPINHO', desc: ['PRESA AO FIO,', 'NUNCA PARA DE GIRAR.'], def: ENEMIES.kite },
      { name: 'AGUA-VIVA-LAMPADA', desc: ['ACESA, QUEIMA.', 'APAGADA, E INOFENSIVA.'], def: ENEMIES.jelly },
      { name: 'PEIXE-AGULHA', desc: ['SO NADA EM', 'LINHA RETA.'], def: ENEMIES.fish },
      { name: 'TOUPEIRA-MINEIRA', desc: ['AVISA COM POEIRA', 'ANTES DE SAIR.'], def: ENEMIES.mole },
      { name: 'MORCEGO-FOLE', desc: ['INFLA E ESTOURA', 'EM VENTO.'], def: ENEMIES.bat },
      { name: 'MARUJO DE BRUMA', desc: ['BLOQUEIA PELA FRENTE,', 'NAO POR CIMA.'], def: ENEMIES.sailor },
      { name: 'CHAMA DE SAL', desc: ['NAO PISE.'], def: ENEMIES.flame },
    ],
  },
  {
    title: 'GUARDIOES',
    entries: [
      { name: 'REI SIRI', desc: ['CRAVA A GARRA NO CHAO', 'E FICA PRESO.'], def: BOSSES.kingcrab },
      { name: 'MAE-MUSGO', desc: ['DESCE DO TETO', 'QUANDO SE CANSA.'], def: BOSSES.motherslug },
      { name: 'BARAO CATA-VENTO', desc: ['QUANDO AS PAS PARAM,', 'O EIXO FICA EXPOSTO.'], def: BOSSES.baron },
      { name: 'MEDUSA-MARE', desc: ['SO PODE SER ATACADA', 'APAGADA.'], def: BOSSES.medusa },
      { name: 'VELHA BROCA', desc: ['FICA TONTA AO', 'BATER NA PAREDE.'], def: BOSSES.drill },
      { name: 'SOMBRA DE LUMI', desc: ['SEGUE SEUS PASSOS', 'UM SEGUNDO DEPOIS.'], def: BOSSES.shadow },
      { name: 'CAPITAO BRUMO', desc: ['EX-FAROLEIRO FEITO', 'DE NEVOA E SAUDADE.'], def: BOSSES.brumo },
    ],
  },
];

export class GalleryScene implements Scene {
  cat = 0;
  idx = 0;
  t = 0;
  update(game: Game): void {
    this.t++;
    const inp = game.input.state;
    const n = GALLERY[this.cat].entries.length;
    if (inp.isPressed('right')) { this.idx = (this.idx + 1) % n; sfx('menu'); }
    if (inp.isPressed('left')) { this.idx = (this.idx + n - 1) % n; sfx('menu'); }
    if (inp.isPressed('down')) { this.cat = (this.cat + 1) % GALLERY.length; this.idx = 0; sfx('menu'); }
    if (inp.isPressed('up')) { this.cat = (this.cat + GALLERY.length - 1) % GALLERY.length; this.idx = 0; sfx('menu'); }
    if (inp.isPressed('spin') || inp.isPressed('pause')) { sfx('menu'); game.transitionTo(() => game.pop(), 'fade'); }
  }
  draw(r: Renderer): void {
    backdrop(r, this.t, 'GALERIA');
    const cat = GALLERY[this.cat];
    const e = cat.entries[this.idx];
    r.text(`< ${cat.title} >`, VIEW_W / 2, 20, '#9fb3c8', 'center');
    const spr = getSprite(e.def, false);
    const f = spr.frames[Math.floor(this.t / 10) % spr.frames.length];
    const scale = Math.max(1, Math.min(4, Math.floor(88 / Math.max(f.w, f.h))));
    r.box(VIEW_W / 2 - 56, 32, 112, 96, 'rgba(10,20,40,0.85)', '#5a6a8a');
    r.drawFrameScaled(f, VIEW_W / 2 - (f.w * scale) / 2, 80 - (f.h * scale) / 2, scale, scale);
    r.text(e.name, VIEW_W / 2, 134, '#ffd24a', 'center', '#000000');
    r.textBlock(e.desc.flatMap((l) => wrap(l, 34)), VIEW_W / 2, 148, '#ffffff', '#000000', 10);
    r.text(`${this.idx + 1}/${cat.entries.length}`, VIEW_W - 8, VIEW_H - 10, '#9fb3c8', 'right');
    r.text('SETAS: NAVEGAR   C: VOLTAR', 8, VIEW_H - 10, 'rgba(255,255,255,0.6)');
  }
}

// ------------------------------------------------------------------ sala de som

export class SoundRoomScene implements Scene {
  tab: 'music' | 'sfx' = 'music';
  idx = 0;
  t = 0;
  playing = -1;
  readonly tracks = TRACK_TITLES.filter(([k]) => MUSIC[k]);
  readonly effects = Object.keys(SFX);

  update(game: Game): void {
    this.t++;
    const inp = game.input.state;
    const n = this.tab === 'music' ? this.tracks.length : this.effects.length;
    if (inp.isPressed('down')) { this.idx = (this.idx + 1) % n; sfx('menu'); }
    if (inp.isPressed('up')) { this.idx = (this.idx + n - 1) % n; sfx('menu'); }
    if (inp.isPressed('left') || inp.isPressed('right')) { this.tab = this.tab === 'music' ? 'sfx' : 'music'; this.idx = 0; sfx('menu'); }
    if (inp.isPressed('jump')) {
      if (this.tab === 'music') { sequencer.play(MUSIC[this.tracks[this.idx][0]]); this.playing = this.idx; }
      else sfx(this.effects[this.idx]);
    }
    if (inp.isPressed('run')) { sequencer.stop(0.3); this.playing = -1; }
    if (inp.isPressed('spin') || inp.isPressed('pause')) {
      sequencer.stop(0.3);
      game.transitionTo(() => game.pop(), 'fade');
    }
  }

  draw(r: Renderer): void {
    backdrop(r, this.t, 'SALA DE SOM');
    r.text(this.tab === 'music' ? '[MUSICAS]  EFEITOS ' : ' MUSICAS  [EFEITOS]', VIEW_W / 2, 20, '#9fb3c8', 'center');
    const list = this.tab === 'music' ? this.tracks.map(([, t]) => t) : this.effects.map((e) => e.toUpperCase());
    const rows = 11;
    const first = Math.max(0, Math.min(list.length - rows, this.idx - Math.floor(rows / 2)));
    for (let i = 0; i < Math.min(rows, list.length); i++) {
      const k = first + i;
      const sel = k === this.idx;
      const y = 34 + i * 11;
      const mark = this.tab === 'music' && k === this.playing ? '~' : ' ';
      r.text(`${sel ? '>' : ' '}${mark}${String(k + 1).padStart(2, '0')} ${list[k]}`, 24, y, sel ? '#ffffff' : '#c9ccd6');
    }
    // visualizador: barras que dançam enquanto toca
    const active = this.playing >= 0 && sequencer.playing;
    for (let i = 0; i < 12; i++) {
      const h = active ? 4 + Math.abs(Math.sin(this.t / (6 + i) + i * 1.7)) * 26 : 2;
      r.fillRect(VIEW_W - 44 + i * 6, 190 - h, 4, h, i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? '#7fd1ff' : '#ff9ac1');
    }
    r.text('Z: TOCAR  X: PARAR  C: VOLTAR', VIEW_W / 2, VIEW_H - 10, 'rgba(255,255,255,0.6)', 'center');
  }
}

// ------------------------------------------------------------------ contra-relógio

export class TimeAttackScene implements Scene {
  idx = 0;
  t = 0;
  ids: string[];
  constructor(game: Game) {
    this.ids = clearedAnywhere(game).filter((id) => LEVELS[id].kind !== 'bonus');
  }
  onEnter(): void {
    sequencer.play(MUSIC.mapa);
  }
  update(game: Game): void {
    this.t++;
    const inp = game.input.state;
    if (inp.isPressed('spin') || inp.isPressed('pause')) { sfx('menu'); sequencer.stop(0.3); game.transitionTo(() => game.pop(), 'fade'); return; }
    if (!this.ids.length) return;
    const n = this.ids.length;
    if (inp.isPressed('down')) { this.idx = (this.idx + 1) % n; sfx('menu'); }
    if (inp.isPressed('up')) { this.idx = (this.idx + n - 1) % n; sfx('menu'); }
    if (inp.isPressed('right')) { this.idx = Math.min(n - 1, this.idx + 10); sfx('menu'); }
    if (inp.isPressed('left')) { this.idx = Math.max(0, this.idx - 10); sfx('menu'); }
    if (inp.isPressed('jump') || inp.isPressed('run')) {
      sfx('select');
      sequencer.stop(0.3);
      const def = LEVELS[this.ids[this.idx]];
      game.transitionTo(() => game.push(new LevelScene(def, game, null, { timeAttack: true })), 'iris');
    }
  }
  draw(r: Renderer, _a: number, game: Game): void {
    backdrop(r, this.t, 'CONTRA-RELOGIO');
    if (!this.ids.length) {
      r.text('CONCLUA FASES PARA CORRER CONTRA O TEMPO.', VIEW_W / 2, 80, '#ffffff', 'center');
      return;
    }
    const rows = 11;
    const first = Math.max(0, Math.min(this.ids.length - rows, this.idx - Math.floor(rows / 2)));
    for (let i = 0; i < Math.min(rows, this.ids.length); i++) {
      const k = first + i;
      const def = LEVELS[this.ids[k]];
      const sel = k === this.idx;
      const y = 24 + i * 12;
      const best = game.save.records[def.id];
      r.text(`${sel ? '>' : ' '} ${levelLabel(def).padEnd(5)} ${def.name}`, 16, y, sel ? '#ffffff' : '#c9ccd6');
      r.text(best !== undefined ? formatTime(best) : '-:--.--', VIEW_W - 16, y, best !== undefined ? '#ffd24a' : '#6a7a8a', 'right');
    }
    r.text('Z: CORRER   C: VOLTAR', VIEW_W / 2, VIEW_H - 10, 'rgba(255,255,255,0.6)', 'center');
  }
}
