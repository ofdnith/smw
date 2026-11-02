/** Créditos rolantes. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sequencer } from '../../engine/audio/sequencer';
import { synth } from '../../engine/audio/synth';
import type { Game, Scene } from '../game';
import { drawBackground } from '../render/backgrounds';
import { MUSIC } from '../../content/music';
import { LUMI, LUMI_PALETTE } from '../../content/art/lumi';
import { BOLOTA } from '../../content/art/bolota';
import { ENEMIES } from '../../content/art/enemies';

const LINES = [
  'LUMI E O ARQUIPELAGO DOS FAROIS', '', '',
  'UM JOGO ORIGINAL', 'FEITO DO ZERO, EM CODIGO', '', '',
  'DESIGN, CODIGO, ARTE E MUSICA', 'CLAUDE', '', '',
  'PRODUTOR E PRIMEIRO JOGADOR', 'OFDNITH', '', '',
  'PERSONAGENS', 'LUMI, A APRENDIZ', 'BOLOTA, O BESOURO', 'DONA ONDINA', 'CAPITAO BRUMO', '', '',
  'ILHAS', 'PRAIA DO SINO', 'BOSQUE ENCHARCADO', 'PENHASCO DOS VENTOS', 'RECIFE PROFUNDO', 'MINAS DE SAL', 'VALE SEM LUA', 'FAROL MESTRE', '', '',
  'OBRIGADO POR JOGAR!', '', 'A NEBLINA TEME A LUZ.',
];

export class CreditsScene implements Scene {
  t = 0;
  musicOn = false;
  constructor(private done: () => void) {}
  update(game: Game): void {
    this.t++;
    if (!this.musicOn && synth.ready) {
      this.musicOn = true;
      sequencer.play(MUSIC.creditos);
    }
    const end = LINES.length * 12 + VIEW_H + 40;
    if ((this.t > end || (game.input.state.isPressed('pause') && this.t > 60))) {
      sequencer.stop(0.5);
      this.done();
    }
  }
  draw(r: Renderer): void {
    r.camX = 0;
    r.camY = 0;
    drawBackground(r, 'ceu', this.t * 0.4, 0, { frame: this.t });
    const y0 = VIEW_H - this.t * 0.5;
    LINES.forEach((l, i) => {
      const y = y0 + i * 12;
      if (y > -10 && y < VIEW_H) r.text(l, VIEW_W / 2, y, i === 0 ? '#ffd24a' : l === l.toUpperCase() && LINES[i + 1] === '' && LINES[i - 1] === '' ? '#ffd1dc' : '#ffffff', 'center', '#000000');
    });
    // desfile
    const px = (this.t * 0.6) % (VIEW_W + 120) - 60;
    r.fillRect(0, VIEW_H - 16, VIEW_W, 16, '#3a2a6a');
    r.drawSprite({ palette: LUMI_PALETTE, frames: LUMI.walk }, Math.floor(this.t / 6) % 4, px, VIEW_H - 40, false, false);
    r.drawSprite(BOLOTA.normal, 1 + (Math.floor(this.t / 6) % 3), px - 26, VIEW_H - 32, false, false);
    r.drawSprite(ENEMIES.crab, Math.floor(this.t / 8) % 2, px - 50, VIEW_H - 28, false, false);
    r.drawSprite(ENEMIES.gull, Math.floor(this.t / 7) % 2, px + 30, VIEW_H - 60 + Math.sin(this.t / 20) * 4, false, false);
  }
}
