/** Pausa com opções. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import type { Game, Scene } from '../game';
import type { LevelScene } from './level';
import { WorldMapScene } from './worldmap';
import { OptionsScene } from './options';

type Item = 'continue' | 'music' | 'sfx' | 'assist' | 'restart' | 'options' | 'exit';

export class PauseScene implements Scene {
  readonly transparent = true;
  index = 0;
  readonly items: Item[];
  constructor(private level: LevelScene) {
    this.items = level.timeAttack
      ? ['continue', 'music', 'sfx', 'restart', 'options', 'exit']
      : ['continue', 'music', 'sfx', 'assist', 'options', 'exit'];
  }
  update(game: Game): void {
    const inp = game.input.state;
    const s = game.save.settings;
    if (inp.isPressed('pause')) {
      sfx('pause');
      game.pop();
      return;
    }
    const n = this.items.length;
    if (inp.isPressed('down')) { this.index = (this.index + 1) % n; sfx('menu'); }
    if (inp.isPressed('up')) { this.index = (this.index + n - 1) % n; sfx('menu'); }
    const item = this.items[this.index];
    const dx = (inp.isPressed('right') ? 1 : 0) - (inp.isPressed('left') ? 1 : 0);
    if (item === 'music' && dx) { s.music = Math.max(0, Math.min(10, s.music + dx)); game.applySettings(); sfx('menu'); }
    if (item === 'sfx' && dx) { s.sfx = Math.max(0, Math.min(10, s.sfx + dx)); game.applySettings(); sfx('menu'); }
    if (inp.isPressed('jump') || inp.isPressed('spin')) {
      sfx('select');
      switch (item) {
        case 'continue': game.pop(); break;
        case 'assist': s.assist = !s.assist; this.level.run.assist = s.assist; break;
        case 'restart': game.pop(); this.level.restartTimeAttack(game); return;
        case 'options': game.push(new OptionsScene(true)); return;
        case 'exit':
          if (this.level.timeAttack) { game.pop(); this.level.leaveTimeAttack(game); return; }
          game.persist();
          game.stopMusic();
          game.transitionTo(() => game.replace(new WorldMapScene(game, null)), 'fade');
          break;
        default: break;
      }
      game.persist();
    }
  }
  draw(r: Renderer, _alpha: number, game: Game): void {
    r.dim(0.6);
    const s = game.save.settings;
    r.box(VIEW_W / 2 - 92, 40, 184, 124);
    r.text('PAUSA', VIEW_W / 2, 48, '#ffd24a', 'center');
    this.items.forEach((it, i) => {
      const y = 66 + i * 14;
      const sel = i === this.index;
      const label: Record<Item, string> = {
        continue: 'CONTINUAR',
        music: `MUSICA  ${'●'.repeat(s.music)}${'.'.repeat(10 - s.music)}`,
        sfx: `EFEITOS ${'●'.repeat(s.sfx)}${'.'.repeat(10 - s.sfx)}`,
        assist: `MODO ASSISTIDO: ${s.assist ? 'SIM' : 'NAO'}`,
        restart: 'RECOMECAR',
        options: 'OPCOES E CONTROLES',
        exit: this.level.timeAttack ? 'DESISTIR' : 'VOLTAR AO MAPA',
      };
      r.text((sel ? '> ' : '  ') + label[it], VIEW_W / 2 - 84, y, sel ? '#ffffff' : '#c9ccd6');
    });
    r.text(`${this.level.level.name}`, VIEW_W / 2, VIEW_H - 22, '#9cf29c', 'center');
  }
}
