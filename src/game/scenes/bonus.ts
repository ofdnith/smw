/** Tenda da Ondina: escolha uma de três conchas. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { Rng } from '../../engine/rng';
import type { Game, Scene } from '../game';
import { ITEMS } from '../../content/art/items';
import { ONDINA } from '../../content/art/npcs';

export class BonusScene implements Scene {
  index = 1;
  chosen = -1;
  t = 0;
  prizes: string[];
  constructor(island: number) {
    const rng = new Rng(Date.now() % 100000 + island);
    const pool = island >= 6 ? ['lantern', 'leaf', 'feather', 'amber30'] : island >= 3 ? ['leaf', 'shell', 'feather', 'amber30'] : ['shell', 'shell', 'feather', 'amber20'];
    this.prizes = [rng.pick(pool), rng.pick(pool), rng.pick(pool)];
  }
  update(game: Game): void {
    this.t++;
    const inp = game.input.state;
    if (this.chosen < 0) {
      if (inp.isPressed('left')) { this.index = Math.max(0, this.index - 1); sfx('menu'); }
      if (inp.isPressed('right')) { this.index = Math.min(2, this.index + 1); sfx('menu'); }
      if (inp.isPressed('jump') || inp.isPressed('run')) {
        this.chosen = this.index;
        this.t = 0;
        const prize = this.prizes[this.chosen];
        const slot = game.slot;
        if (prize === 'feather') { slot.lives = Math.min(99, slot.lives + 1); sfx('oneup'); }
        else if (prize.startsWith('amber')) { slot.amber += parseInt(prize.slice(5), 10); if (slot.amber >= 100) { slot.amber -= 100; slot.lives++; } sfx('amber'); }
        else {
          if (slot.power === 'none') slot.power = prize;
          else if (slot.reserve === 'none' || slot.reserve === 'shell') slot.reserve = prize;
          sfx('powerup');
        }
        game.persist();
      }
    } else if (this.t > 90 && inp.anyPressed()) {
      game.transitionTo(() => game.pop(), 'fade');
    }
  }
  draw(r: Renderer): void {
    r.gradient([[0, '#3a1a28'], [1, '#6a3a48']]);
    r.text('TENDA DA ONDINA', VIEW_W / 2, 14, '#ffd1dc', 'center');
    r.drawSprite(ONDINA, Math.floor(this.t / 30) % 2, VIEW_W / 2 - 12, 30, false, false);
    r.text(this.chosen < 0 ? 'ESCOLHA UMA CONCHA, QUERIDA.' : 'QUE A LUZ TE GUIE!', VIEW_W / 2, 74, '#ffffff', 'center');
    for (let i = 0; i < 3; i++) {
      const x = VIEW_W / 2 - 60 + i * 60;
      const y = 100 + (i === this.index && this.chosen < 0 ? Math.sin(this.t / 8) * 2 : 0);
      r.box(x - 16, y - 4, 32, 32, i === this.index ? '#4a2a38' : '#2a1a28', i === this.index ? '#ffd24a' : '#8a6a78');
      if (this.chosen === i) {
        const p = this.prizes[i];
        const spr = p.startsWith('amber') ? ITEMS.amber : ITEMS[p];
        if (spr) r.drawSprite(spr, 0, x - 8, y + 2, false, false);
        if (p.startsWith('amber')) r.text(`+${p.slice(5)}`, x, y + 20, '#ffd27a', 'center');
      } else {
        r.drawSprite(ITEMS.shell, 0, x - 8, y + 6, false, false);
      }
    }
    if (this.chosen >= 0 && this.t > 90) r.text('APERTE UM BOTAO', VIEW_W / 2, VIEW_H - 20, '#ffd24a', 'center');
  }
}
