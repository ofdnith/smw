/** Fim de jogo: volta com 5 vidas para o mapa. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sequencer } from '../../engine/audio/sequencer';
import type { Game, Scene } from '../game';
import { WorldMapScene } from './worldmap';
import { MUSIC } from '../../content/music';

export class GameOverScene implements Scene {
  t = 0;
  onEnter(): void {
    const s = MUSIC.gameover;
    if (s) sequencer.play(s);
  }
  update(game: Game): void {
    this.t++;
    if (this.t > 60 && game.input.state.anyPressed()) {
      const slot = game.slot;
      slot.lives = 5;
      slot.power = 'none';
      game.persist();
      game.stopMusic();
      game.transitionTo(() => game.replace(new WorldMapScene(game, null)), 'fade');
    }
  }
  draw(r: Renderer): void {
    r.clear('#05060f');
    r.text('A NEBLINA VENCEU...', VIEW_W / 2, 60, '#9fb3c8', 'center');
    r.text('DESTA VEZ.', VIEW_W / 2, 74, '#9fb3c8', 'center');
    if (this.t > 60 && Math.floor(this.t / 30) % 2 === 0) r.text('APERTE UM BOTAO', VIEW_W / 2, VIEW_H - 40, '#ffd24a', 'center');
  }
}
