/** Pausa com opções. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import type { Game, Scene } from '../game';
import type { LevelScene } from './level';
import { WorldMapScene } from './worldmap';

export class PauseScene implements Scene {
  readonly transparent = true;
  index = 0;
  items = ['CONTINUAR', 'MUSICA', 'EFEITOS', 'MODO ASSISTIDO', 'CONTROLES NA TELA', 'VOLTAR AO MAPA'];
  constructor(private level: LevelScene) {}
  update(game: Game): void {
    const inp = game.input.state;
    const s = game.save.settings;
    if (inp.isPressed('pause')) {
      sfx('pause');
      game.pop();
      return;
    }
    if (inp.isPressed('down')) { this.index = (this.index + 1) % this.items.length; sfx('menu'); }
    if (inp.isPressed('up')) { this.index = (this.index + this.items.length - 1) % this.items.length; sfx('menu'); }
    const dx = (inp.isPressed('right') ? 1 : 0) - (inp.isPressed('left') ? 1 : 0);
    if (this.index === 1 && dx) { s.music = Math.max(0, Math.min(10, s.music + dx)); game.applySettings(); sfx('menu'); }
    if (this.index === 2 && dx) { s.sfx = Math.max(0, Math.min(10, s.sfx + dx)); game.applySettings(); sfx('menu'); }
    if (inp.isPressed('jump') || inp.isPressed('spin')) {
      sfx('select');
      switch (this.index) {
        case 0: game.pop(); break;
        case 3: s.assist = !s.assist; this.level.run.assist = s.assist; break;
        case 4: s.touch = !s.touch; game.applySettings(); break;
        case 5: {
          game.persist();
          game.stopMusic();
          game.transitionTo(() => game.replace(new WorldMapScene(game, null)), 'fade');
          break;
        }
      }
      game.persist();
    }
  }
  draw(r: Renderer, _alpha: number, game: Game): void {
    r.dim(0.6);
    const s = game.save.settings;
    r.box(70, 30, 180, 120);
    r.text('PAUSA', VIEW_W / 2, 38, '#ffd24a', 'center');
    this.items.forEach((it, i) => {
      const y = 56 + i * 14;
      const sel = i === this.index;
      let label = it;
      if (i === 1) label = `MUSICA  ${'●'.repeat(s.music)}${'.'.repeat(10 - s.music)}`;
      if (i === 2) label = `EFEITOS ${'●'.repeat(s.sfx)}${'.'.repeat(10 - s.sfx)}`;
      if (i === 3) label = `MODO ASSISTIDO: ${s.assist ? 'SIM' : 'NAO'}`;
      if (i === 4) label = `CONTROLES NA TELA: ${s.touch ? 'SIM' : 'NAO'}`;
      r.text((sel ? '> ' : '  ') + label, 82, y, sel ? '#ffffff' : '#c9ccd6');
    });
    r.text(`${this.level.level.name}`, VIEW_W / 2, VIEW_H - 22, '#9cf29c', 'center');
  }
}
