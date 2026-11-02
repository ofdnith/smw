/** Tela de título e seleção de arquivo. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { synth } from '../../engine/audio/synth';
import { sequencer } from '../../engine/audio/sequencer';
import type { Game, Scene } from '../game';
import { drawBackground } from '../render/backgrounds';
import { glyph, FONT_W } from '../../engine/font';
import { LUMI, LUMI_PALETTE } from '../../content/art/lumi';
import { BOLOTA } from '../../content/art/bolota';
import { MUSIC } from '../../content/music';
import { newSlot, slotProgress } from '../../engine/save';
import { WorldMapScene } from './worldmap';
import { LEVELS } from '../../content/levels';
import { CreditsScene } from './credits';
import { ExtrasScene } from './extras';
import { OptionsScene } from './options';

export class TitleScene implements Scene {
  t = 0;
  started = false;
  musicOn = false;
  update(game: Game): void {
    this.t++;
    const inp = game.input.state;
    if (!this.musicOn && synth.ready) {
      this.musicOn = true;
      sequencer.play(MUSIC.titulo);
    }
    if (inp.anyPressed() && this.t > 20) {
      if (!synth.ready) synth.unlock();
      sfx('select');
      game.transitionTo(() => game.push(new FileSelectScene()), 'fade');
    }
  }
  draw(r: Renderer): void {
    r.camX = 0;
    r.camY = 0;
    drawBackground(r, 'praia', this.t * 0.5, 0, { frame: this.t });
    // areia
    r.fillRect(0, VIEW_H - 46, VIEW_W, 46, '#f2dca6');
    r.fillRect(0, VIEW_H - 46, VIEW_W, 2, '#fff2c8');
    // Lumi correndo e Bolota
    const lx = 40 + ((this.t * 0.8) % 400) - 40;
    r.drawSprite({ palette: LUMI_PALETTE, frames: LUMI.run }, Math.floor(this.t / 4) % 4, lx, VIEW_H - 70, false, false);
    r.drawSprite(BOLOTA.normal, 1 + (Math.floor(this.t / 5) % 3), lx - 34, VIEW_H - 62, false, false);
    // logo
    const y = 30 + Math.sin(this.t / 40) * 2;
    r.box(VIEW_W / 2 - 110, y - 10, 220, 66, 'rgba(10,20,40,0.75)', '#ffd24a');
    // "LUMI" em 3x com sombra
    const word = 'LUMI';
    const scale = 3;
    const wordW = (word.length * FONT_W - 1) * scale;
    let gx = VIEW_W / 2 - wordW / 2;
    for (const ch of word) {
      const sh = glyph(ch, '#7a4a00');
      const gl = glyph(ch, '#ffd24a');
      if (sh) r.drawFrameScaled(sh, gx + 2, y - 2 + 2, scale, scale);
      if (gl) r.drawFrameScaled(gl, gx, y - 2, scale, scale);
      gx += FONT_W * scale;
    }
    r.text('E O ARQUIPELAGO', VIEW_W / 2, y + 26, '#ffffff', 'center', '#000000');
    r.text('DOS FAROIS', VIEW_W / 2, y + 38, '#ffffff', 'center', '#000000');
    // feixe de farol girando
    r.ctx.globalAlpha = 0.15 + 0.1 * Math.sin(this.t / 20);
    r.ctx.fillStyle = '#fff7b0';
    r.ctx.beginPath();
    const a = this.t / 120;
    r.ctx.moveTo(VIEW_W - 30, 20);
    r.ctx.lineTo(VIEW_W - 30 + Math.cos(a) * 400, 20 + Math.sin(a) * 400);
    r.ctx.lineTo(VIEW_W - 30 + Math.cos(a + 0.3) * 400, 20 + Math.sin(a + 0.3) * 400);
    r.ctx.fill();
    r.ctx.globalAlpha = 1;
    if (Math.floor(this.t / 30) % 2 === 0 && this.t > 20) r.text('APERTE UM BOTAO', VIEW_W / 2, VIEW_H - 16, '#ffffff', 'center', '#000000');
    r.text('V1.3', 4, VIEW_H - 10, 'rgba(0,0,0,0.5)', 'left', null);
  }
}

export class FileSelectScene implements Scene {
  index = 0;
  confirmDelete = -1;
  t = 0;
  update(game: Game): void {
    this.t++;
    const inp = game.input.state;
    if (synth.ready && !sequencer.playing) sequencer.play(MUSIC.titulo);
    const total = Object.values(LEVELS).filter((l) => l.kind !== 'bonus').length;
    void total;
    if (this.confirmDelete >= 0) {
      if (inp.isPressed('jump')) {
        game.save.slots[this.confirmDelete] = null;
        game.persist();
        this.confirmDelete = -1;
        sfx('blockbreak');
      } else if (inp.isPressed('spin') || inp.isPressed('pause') || inp.isPressed('run')) {
        this.confirmDelete = -1;
        sfx('menu');
      }
      return;
    }
    // 0-2: arquivos; 3-5: EXTRAS / OPCOES / CREDITOS (na mesma linha)
    if (inp.isPressed('down')) { this.index = this.index < 3 ? this.index + 1 : 0; sfx('menu'); }
    if (inp.isPressed('up')) { this.index = this.index === 0 ? 3 : this.index >= 3 ? 2 : this.index - 1; sfx('menu'); }
    if (this.index >= 3 && inp.isPressed('right')) { this.index = this.index === 5 ? 3 : this.index + 1; sfx('menu'); }
    if (this.index >= 3 && inp.isPressed('left')) { this.index = this.index === 3 ? 5 : this.index - 1; sfx('menu'); }
    if (inp.isPressed('spin') && this.index < 3 && game.save.slots[this.index]) {
      this.confirmDelete = this.index;
      sfx('menu');
    }
    if (inp.isPressed('jump') || inp.isPressed('pause')) {
      if (this.index >= 3) {
        sfx('select');
        const next = this.index === 3 ? new ExtrasScene() : this.index === 4 ? new OptionsScene() : new CreditsScene(() => game.pop());
        game.transitionTo(() => game.push(next), 'fade');
        return;
      }
      sfx('select');
      game.slotIndex = this.index;
      if (!game.save.slots[this.index]) game.save.slots[this.index] = newSlot();
      game.persist();
      sequencer.stop(0.3);
      game.transitionTo(() => game.replace(new WorldMapScene(game, null)), 'iris');
    }
  }
  draw(r: Renderer, _a: number, game: Game): void {
    r.camX = 0;
    r.camY = 0;
    drawBackground(r, 'praia', this.t * 0.3, 0, { frame: this.t, night: true });
    r.text('ESCOLHA UM FAROL', VIEW_W / 2, 14, '#ffd24a', 'center', '#000000');
    const total = Object.values(LEVELS).filter((l) => l.kind !== 'bonus').length;
    for (let i = 0; i < 3; i++) {
      const s = game.save.slots[i];
      const y = 36 + i * 40;
      const sel = this.index === i;
      r.box(16, y, VIEW_W - 32, 32, sel ? '#1a2a4a' : 'rgba(10,20,40,0.8)', sel ? '#ffd24a' : '#5a6a8a');
      r.text(`FAROL ${i + 1}`, 26, y + 5, sel ? '#ffffff' : '#c9ccd6');
      if (s) {
        const pearls = Object.values(s.pearls).reduce((acc, m) => acc + ((m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1)), 0);
        r.text(`${slotProgress(s, total)}%  VIDAS ${s.lives}  PEROLAS ${pearls}`, 26, y + 18, '#9cf29c');
        const h = Math.floor(s.playtimeFrames / 216000), m = Math.floor((s.playtimeFrames / 3600) % 60);
        r.text(`${h}H${String(m).padStart(2, '0')}`, VIEW_W - 26, y + 5, '#c9ccd6', 'right');
      } else r.text('NOVA AVENTURA', 26, y + 18, '#9fb3c8');
    }
    const ySel = 36 + 3 * 40 + 4;
    ['EXTRAS', 'OPCOES', 'CREDITOS'].forEach((label, k) => {
      const sel = this.index === 3 + k;
      r.text((sel ? '> ' : '  ') + label, 14 + k * 80, ySel + 2, sel ? '#ffffff' : '#c9ccd6');
    });
    r.text('Z/A: ESCOLHER   C/B: APAGAR', VIEW_W / 2, VIEW_H - 12, 'rgba(255,255,255,0.6)', 'center');
    if (this.confirmDelete >= 0) {
      r.dim(0.6);
      r.box(VIEW_W / 2 - 100, 90, 200, 40);
      r.text(`APAGAR O FAROL ${this.confirmDelete + 1}?`, VIEW_W / 2, 98, '#ff8a8a', 'center');
      r.text('Z/A: SIM     C/B: NAO', VIEW_W / 2, 114, '#ffffff', 'center');
    }
  }
}
