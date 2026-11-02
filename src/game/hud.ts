/** HUD: vidas, âmbar, pérolas, medidor de ímpeto, item reservado, chefe, mensagens. */
import { Renderer, VIEW_W, VIEW_H } from '../engine/renderer';
import type { Game } from './game';
import type { World } from './world';
import type { LevelDef } from './level/format';
import { ITEMS } from '../content/art/items';
import { LUMI, LUMI_PALETTE } from '../content/art/lumi';
import { PHYS } from './entities/player';

const HUD_ICON = { palette: LUMI_PALETTE, frames: [LUMI.idle[0]] };

export function drawHud(r: Renderer, w: World, level: LevelDef, game: Game): void {
  const run = w.run;
  // vidas
  r.drawSprite(HUD_ICON, 0, 6, 2, false, false);
  r.text(`x${run.lives}`, 24, 10, '#ffffff', 'left', '#000000');
  // medidor de ímpeto
  const full = 7 * PHYS.dashFillFrames;
  const segs = Math.floor((w.player.dashMeter / full) * 7 + 0.001);
  for (let i = 0; i < 7; i++) {
    const on = i < segs;
    const isFull = w.player.dashMeter >= full;
    r.fillRect(24 + i * 6, 21, 5, 4, on ? (isFull && w.frame % 10 < 5 ? '#ffffff' : '#ffd24a') : 'rgba(0,0,0,0.45)', false);
  }
  // reserva (centro)
  r.box(VIEW_W / 2 - 11, 3, 22, 22, 'rgba(10,20,40,0.7)', '#c9ccd6');
  if (run.reserve !== 'none') {
    const spr = ITEMS[run.reserve];
    if (spr) r.drawSprite(spr, 0, VIEW_W / 2 - 8, 7, false, false);
  }
  // âmbar
  r.drawSprite(ITEMS.amber, Math.floor(w.frame / 8) % 4, VIEW_W - 60, 4, false, false);
  r.text(`${run.amber}`.padStart(2, '0'), VIEW_W - 48, 5, '#ffffff', 'left', '#000000');
  // pérolas
  const all = run.pearlsThisLevel | run.pearlsSaved;
  for (let i = 0; i < 3; i++) {
    const has = (all & (1 << i)) !== 0;
    const now = (run.pearlsThisLevel & (1 << i)) !== 0;
    r.ctx.globalAlpha = has ? (now ? 1 : 0.6) : 0.25;
    r.drawSprite(ITEMS.pearl, now ? Math.floor(w.frame / 10) % 4 : 0, VIEW_W - 62 + i * 12, 16, false, false);
    r.ctx.globalAlpha = 1;
  }
  // chefe
  if (w.bossHp >= 0) {
    const max = 6;
    const n = Math.min(max, (w.entities.find((e) => e.kind.startsWith('boss')) as { maxHp?: number } | undefined)?.maxHp ?? 3);
    r.text(w.bossName, VIEW_W / 2, VIEW_H - 22, '#ffd1dc', 'center', '#000000');
    for (let i = 0; i < n; i++) r.fillRect(VIEW_W / 2 - n * 6 + i * 12, VIEW_H - 12, 10, 5, i < w.bossHp ? '#ff5a5a' : 'rgba(0,0,0,0.5)', false);
  }
  // mensagem
  if (w.message && w.messageTimer > 0) {
    const lines = w.message;
    const hgt = lines.length * 10 + 10;
    const y = 30;
    r.box(20, y, VIEW_W - 40, hgt);
    r.textBlock(lines, VIEW_W / 2, y + 6, '#ffffff');
  }
  // nome da fase no início
  if (w.time < 150 && !w.startedFromCheckpoint) {
    const a = w.time < 30 ? w.time / 30 : w.time > 120 ? (150 - w.time) / 30 : 1;
    r.ctx.globalAlpha = a;
    r.box(VIEW_W / 2 - 80, 40, 160, 22);
    r.text(level.name, VIEW_W / 2, 47, '#ffd24a', 'center');
    r.ctx.globalAlpha = 1;
  }
  // fim de fase
  if (w.event === 'goal' || w.event === 'secret') {
    const t = w.eventTimer;
    if (t > 30) {
      const k = Math.min(1, (t - 30) / 20);
      const y = 50 - (1 - k) * 60;
      r.box(VIEW_W / 2 - 70, y, 140, 48);
      r.text(w.event === 'secret' ? 'SAIDA SECRETA!' : 'FAROL A VISTA!', VIEW_W / 2, y + 6, '#ffd24a', 'center');
      r.text(`AMBAR ${run.amber}`, VIEW_W / 2, y + 18, '#ffffff', 'center');
      const pearls = [0, 1, 2].filter((i) => ((run.pearlsThisLevel | run.pearlsSaved) & (1 << i)) !== 0).length;
      r.text(`PEROLAS ${pearls}/3`, VIEW_W / 2, y + 28, '#dff6ff', 'center');
      if (game.slot.cleared.includes(level.id) === false && t > 120) r.text('NOVO CAMINHO!', VIEW_W / 2, y + 38, '#9cf29c', 'center');
    }
  }
}
