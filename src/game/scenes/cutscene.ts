/** Cenas de história: quadros curtos com texto digitado. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import type { Game, Scene } from '../game';
import type { SpriteDef } from '../../engine/sprites';
import { LUMI, LUMI_PALETTE } from '../../content/art/lumi';
import { ONDINA } from '../../content/art/npcs';
import { BOSSES } from '../../content/art/bosses';
import { BOLOTA } from '../../content/art/bolota';
import { MAP_ICONS } from '../../content/art/mapicons';
import { drawBackground } from '../render/backgrounds';
import type { Theme } from '../level/format';
import { wrap } from '../entities/items';

interface Actor { spr: SpriteDef; frame?: number; x: number; y: number; flip?: boolean; scale?: number }
export interface Panel { theme: Theme; night?: boolean; actors: Actor[]; text: string; speaker?: string }

const LUMI_IDLE: SpriteDef = { palette: LUMI_PALETTE, frames: LUMI.idle };
const LUMI_HAPPY: SpriteDef = { palette: LUMI_PALETTE, frames: LUMI.victory };
const LUMI_RUN: SpriteDef = { palette: LUMI_PALETTE, frames: LUMI.run };

export const CUTSCENES: Record<string, Panel[]> = {
  intro: [
    { theme: 'praia', night: true, actors: [{ spr: MAP_ICONS.farol, frame: 1, x: 220, y: 70, scale: 2 }, { spr: ONDINA, x: 90, y: 100 }, { spr: LUMI_IDLE, x: 130, y: 100 }], text: 'O ARQUIPELAGO VELA E GUIADO POR SETE FAROIS.', speaker: '' },
    { theme: 'praia', night: true, actors: [{ spr: MAP_ICONS.farol, frame: 0, x: 220, y: 70, scale: 2 }, { spr: ONDINA, x: 90, y: 100 }, { spr: LUMI_IDLE, x: 130, y: 100 }], text: 'NUMA NOITE SEM LUA, A NEBLINA MARE ENGOLIU AS CHAMAS. OS NAVIOS PARARAM DE CHEGAR.' },
    { theme: 'praia', night: true, actors: [{ spr: ONDINA, x: 90, y: 100 }, { spr: LUMI_IDLE, x: 130, y: 100 }], text: 'LUMI, MINHA APRENDIZ... ESTAS ESCADAS SAO ALTAS DEMAIS PARA MIM. LEVE A LANTERNA.', speaker: 'ONDINA' },
    { theme: 'praia', night: true, actors: [{ spr: ONDINA, x: 90, y: 100 }, { spr: LUMI_HAPPY, x: 130, y: 100 }], text: 'EU REACENDO TODOS OS SETE, DONA ONDINA. PROMETO!', speaker: 'LUMI' },
    { theme: 'praia', actors: [{ spr: LUMI_RUN, x: 150, y: 110 }], text: 'CORRA, PULE E ENCONTRE OS SEGREDOS DO ARQUIPELAGO. A NEBLINA TEME A LUZ.' },
  ],
  'farol-1': [
    { theme: 'praia', night: true, actors: [{ spr: MAP_ICONS.farol, frame: 2, x: 200, y: 60, scale: 2 }, { spr: LUMI_HAPPY, x: 110, y: 100 }], text: 'O FAROL DO SINO BRILHA DE NOVO! MAS A NEBLINA SE MOVE PARA O NORTE...' },
    { theme: 'praia', night: true, actors: [{ spr: LUMI_IDLE, x: 110, y: 100 }], text: 'UMA CARTA DE ONDINA: "NO BOSQUE VIVE UM BESOURO QUE ROLA COMO BOLA. ELE VAI GOSTAR DE VOCE."', speaker: 'CARTA' },
  ],
  'farol-2': [
    { theme: 'bosque', actors: [{ spr: BOLOTA.normal, x: 150, y: 112 }, { spr: LUMI_HAPPY, x: 120, y: 100 }], text: 'BOLOTA! DOIS FAROIS ACESOS. O VENTO LA EM CIMA PARECE RAIVOSO.' },
  ],
  'farol-3': [
    { theme: 'penhasco', actors: [{ spr: LUMI_IDLE, x: 130, y: 100 }, { spr: BOSSES.brumo, x: 200, y: 96 }], text: 'ENTAO VOCE E A APRENDIZ DA ONDINA. EU TAMBEM FUI FAROLEIRO, SABIA? ATE TODOS IREM EMBORA.', speaker: 'BRUMO' },
    { theme: 'penhasco', actors: [{ spr: LUMI_IDLE, x: 130, y: 100 }, { spr: BOSSES.brumo, x: 200, y: 96 }], text: 'NO ESCURO NINGUEM PARTE. NO ESCURO TODOS FICAM. DESISTA, MENINA.', speaker: 'BRUMO' },
    { theme: 'penhasco', actors: [{ spr: LUMI_HAPPY, x: 130, y: 100 }], text: 'NINGUEM FICA POR MEDO, CAPITAO. FICA POR LUZ.', speaker: 'LUMI' },
  ],
  'farol-4': [
    { theme: 'recife', actors: [{ spr: LUMI_HAPPY, x: 150, y: 100 }], text: 'QUATRO FAROIS! AS MINAS DE SAL GUARDAM UMA SURPRESA PARA BOLOTA, DIZ A CARTA.' },
  ],
  'farol-5': [
    { theme: 'minas', actors: [{ spr: BOLOTA.pedra, x: 120, y: 112 }, { spr: BOLOTA.seda, x: 180, y: 112 }, { spr: LUMI_HAPPY, x: 150, y: 100 }], text: 'BOLOTA PEDRA E BOLOTA SEDA! SO FALTAM DOIS FAROIS. O VALE SEM LUA E O MAIS ESCURO DE TODOS.' },
  ],
  'farol-6': [
    { theme: 'vale', actors: [{ spr: LUMI_IDLE, x: 150, y: 100 }], text: 'A SOMBRA ERA EU MESMA... COM MEDO. SEIS FAROIS. AGORA, O FAROL MESTRE.' },
  ],
  'farol-7': [
    { theme: 'farol', actors: [{ spr: LUMI_IDLE, x: 120, y: 100 }, { spr: BOSSES.brumoStun, x: 200, y: 96 }], text: 'VOCE... ACENDEU TODOS. OS NAVIOS VAO VOLTAR. E DEPOIS VAO EMBORA DE NOVO.', speaker: 'BRUMO' },
    { theme: 'farol', actors: [{ spr: LUMI_HAPPY, x: 120, y: 100 }, { spr: BOSSES.brumoStun, x: 200, y: 96 }], text: 'E DEPOIS VOLTAM. E PRA ISSO QUE SERVE UM FAROL, CAPITAO. QUER SUBIR AS ESCADAS COMIGO?', speaker: 'LUMI' },
    { theme: 'praia', actors: [{ spr: MAP_ICONS.farol, frame: 2, x: 200, y: 60, scale: 2 }, { spr: ONDINA, x: 90, y: 100 }, { spr: LUMI_HAPPY, x: 130, y: 100 }, { spr: BOLOTA.normal, x: 160, y: 112 }], text: 'E O ARQUIPELAGO VELA VOLTOU A BRILHAR. FIM... POR ENQUANTO.' },
  ],
};

export class CutsceneScene implements Scene {
  index = 0;
  chars = 0;
  t = 0;
  constructor(private panels: Panel[], private done: () => void) {}
  update(game: Game): void {
    this.t++;
    const p = this.panels[this.index];
    if (this.chars < p.text.length) {
      if (this.t % 2 === 0) {
        this.chars++;
        if (this.chars % 3 === 0) sfx('text');
      }
      if (game.input.state.isPressed('jump') || game.input.state.isPressed('run')) this.chars = p.text.length;
      return;
    }
    if (game.input.state.isPressed('jump') || game.input.state.isPressed('run') || game.input.state.isPressed('pause')) {
      sfx('select');
      this.index++;
      this.chars = 0;
      if (this.index >= this.panels.length) this.done();
    }
  }
  draw(r: Renderer): void {
    const p = this.panels[Math.min(this.index, this.panels.length - 1)];
    r.camX = 0;
    r.camY = 0;
    drawBackground(r, p.theme, 0, 0, { frame: this.t, night: p.night });
    r.fillRect(0, 124, VIEW_W, VIEW_H - 124, 'rgba(0,0,0,0.0)');
    for (const a of p.actors) {
      const frames = a.spr.frames.length;
      const fi = a.frame ?? Math.floor(this.t / 30) % frames;
      if (a.scale && a.scale !== 1) {
        const s = r.ctx;
        s.save();
        s.imageSmoothingEnabled = false;
        const img = (await0(a.spr, fi, !!a.flip));
        s.drawImage(img.img, Math.round(a.x), Math.round(a.y), img.w * a.scale, img.h * a.scale);
        s.restore();
      } else r.drawSprite(a.spr, fi, a.x, a.y, a.flip, false);
    }
    // letterbox + texto
    r.fillRect(0, 0, VIEW_W, 10, '#000000');
    r.fillRect(0, VIEW_H - 54, VIEW_W, 54, 'rgba(0,0,0,0.85)');
    const lines = wrap(p.text.slice(0, this.chars), 48);
    if (p.speaker) r.text(p.speaker, 12, VIEW_H - 50, '#ffd24a');
    lines.forEach((l, i) => r.text(l, 12, VIEW_H - (p.speaker ? 40 : 48) + i * 10, '#ffffff'));
    if (this.chars >= p.text.length && Math.floor(this.t / 20) % 2 === 0) r.text('>', VIEW_W - 14, VIEW_H - 12, '#ffd24a');
  }
}

import { getSprite } from '../../engine/sprites';
function await0(def: SpriteDef, frame: number, flip: boolean): { img: CanvasImageSource; w: number; h: number } {
  const s = getSprite(def, flip);
  const f = s.frames[frame % s.frames.length];
  return { img: f.img, w: f.w, h: f.h };
}
