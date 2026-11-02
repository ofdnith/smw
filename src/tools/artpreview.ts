/** Pré-visualização de toda a arte: ?art=1. Desenha sprites em grade para revisão. */
import type { Renderer } from '../engine/renderer';
import type { SpriteDef } from '../engine/sprites';
import { LUMI, LUMI_PALETTE, ACCESSORY } from '../content/art/lumi';
import { BOLOTA } from '../content/art/bolota';
import { ITEMS, GHOST, SIGN, BELL, GOAL_ARCH } from '../content/art/items';
import { ENEMIES } from '../content/art/enemies';
import { BOSSES } from '../content/art/bosses';
import { OBJECTS } from '../content/art/objects';
import { MAP_ICONS } from '../content/art/mapicons';
import { ONDINA, LIGHTHOUSE } from '../content/art/npcs';
import type { Scene } from '../game/game';

export class ArtPreviewScene implements Scene {
  t = 0;
  page = 0;
  update(): void {
    this.t++;
  }
  draw(r: Renderer): void {
    r.clear('#2a3a4a');
    r.camX = 0;
    r.camY = 0;
    const groups: [string, Record<string, SpriteDef>][] = [
      ['LUMI', Object.fromEntries(Object.entries(LUMI).map(([k, frames]) => [k, { palette: LUMI_PALETTE, frames }]))],
      ['ACESSORIOS/BOLOTA', { ...ACCESSORY, ...BOLOTA }],
      ['ITENS', { ...ITEMS, ghost: GHOST, sign: SIGN, bell: BELL, arch: GOAL_ARCH }],
      ['INIMIGOS', ENEMIES],
      ['CHEFES', BOSSES],
      ['OBJETOS/MAPA/NPC', { ...OBJECTS, ...MAP_ICONS, ondina: ONDINA, farol: LIGHTHOUSE }],
    ];
    const [title, set] = groups[this.page % groups.length];
    r.text(title + '  (SETAS MUDAM DE PAGINA)', 4, 2, '#ffd24a');
    let x = 4, y = 14, rowH = 0;
    for (const [name, def] of Object.entries(set)) {
      const first = def.frames[0].split('\n').filter((l) => l.trim().length);
      const w = Math.max(...first.map((l) => l.length)), h = first.length;
      if (x + w + 4 > 316) {
        x = 4;
        y += rowH + 10;
        rowH = 0;
      }
      const frame = Math.floor(this.t / 10) % def.frames.length;
      r.drawSprite(def, frame, x, y, false, false);
      r.text(name.slice(0, Math.max(2, Math.floor(w / 6) + 1)), x, y + h + 1, '#c9ccd6');
      x += Math.max(w, 14) + 8;
      rowH = Math.max(rowH, h);
    }
  }
}
