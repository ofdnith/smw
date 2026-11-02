/** Objetos de fase esculpidos em 16 bits. Mesmas dimensões e âncoras dos originais. */
import type { SpriteDef } from '../../engine/sprites';
import { Canvas, Materials } from '../../engine/pixelart';

type Draw = (c: Canvas, f: number) => void;
function spr(w: number, h: number, mats: Materials, frames: number, fn: Draw, post?: Draw): SpriteDef {
  const out: string[] = [];
  for (let f = 0; f < frames; f++) {
    const c = new Canvas(w, h, mats);
    fn(c, f);
    c.outline();
    post?.(c, f);
    out.push(c.toString());
  }
  return { palette: mats.palette(), frames: out };
}

const M = new Materials({
  wood: '#b07a42', plank: '#d8a868', moss: '#6fbf4a', rope: '#e0b878', metal: '#8a90a0', red: '#e04a3a', spring: '#c9ccd6',
  iron: '#4a4f5e', brass: '#e0b040', door: '#8a5a2e', glow: '#ffe28a', blade: '#d8dce6', cart: '#7a5a3a', rail: '#5a5f6e',
});

export const OBJECTS: Record<string, SpriteDef> = {
  // plataforma móvel: tábuas com cordas
  platform: spr(32, 8, M, 1, (c) => {
    c.rect(1, 1, 30, 5, 'plank', 'box', 1);
    for (let x = 7; x < 31; x += 6) c.line(x, 2, x, 5, 'plank', 1);
    c.rect(1, 5, 30, 1, 'wood', 'flat', 0, -1);
    c.set(3, 2, 'metal', 3).set(28, 2, 'metal', 3);
  }),
  // plataforma que cai: madeira velha, rachada e com musgo
  fallPlatform: spr(32, 8, M, 1, (c) => {
    c.rect(1, 1, 30, 5, 'wood', 'box', 1);
    c.line(9, 1, 11, 5, 'wood', 0).line(20, 2, 18, 5, 'wood', 0);
    for (const x of [3, 4, 14, 25, 26, 27]) c.set(x, 1, 'moss', 3);
    c.set(15, 1, 'moss', 2);
  }),
  // mola: base, espiral e tampo vermelho (frame 1: comprimida)
  spring: spr(16, 10, M, 2, (c, f) => {
    const top = f ? 5 : 1;
    c.rect(2, 8, 12, 2, 'metal', 'box');
    for (let y = top + 3; y < 8; y += 2) c.line(4, y, 11, y, 'spring', y % 4 === 0 ? 3 : 1, 1);
    c.rect(1, top, 14, 3, 'red', 'box', 1);
    c.set(3, top, 'red', 4).set(4, top, 'red', 4);
  }),
  // canhão de areia (aponta para a direita)
  cannon: spr(16, 16, M, 2, (c, f) => {
    c.rect(2, 10, 12, 6, 'wood', 'box', 1);
    c.circle(4, 14, 2, 'iron', 'sphere');
    c.circle(12, 14, 2, 'iron', 'sphere');
    c.rect(3, 4, 11 + (f ? -1 : 0), 7, 'iron', 'cyl', 3);
    c.rect(13 + (f ? -1 : 0), 3, 3, 9, 'iron', 'box', 1);
    c.rect(5, 6, 1, 3, 'brass', 'flat', 0, 1);
  }, (c, f) => { if (f) { c.set(15, 6, 'glow', 4).set(15, 7, 'glow', 3); } }),
  // porta de madeira (frame 1: Lumi perto, brilha)
  door: spr(16, 32, M, 2, (c, f) => {
    c.rect(1, 1, 14, 31, 'door', 'box', 3);
    for (const x of [5, 9]) c.line(x, 4, x, 30, 'door', 1);
    c.rect(2, 12, 12, 1, 'metal', 'flat', 0, 1).rect(2, 24, 12, 1, 'metal', 'flat', 0, 1);
    c.circle(11.5, 18.5, 1.2, 'brass', 'flat', f ? 2 : 0);
  }, (c, f) => { if (f) { c.set(3, 3, 'glow', 4).set(12, 3, 'glow', 4); } }),
  // serra giratória
  saw: spr(16, 16, M, 2, (c, f) => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (f ? Math.PI / n : 0);
      c.poly([[8 + Math.cos(a) * 5, 8 + Math.sin(a) * 5], [8 + Math.cos(a + 0.25) * 7.6, 8 + Math.sin(a + 0.25) * 7.6], [8 + Math.cos(a + 0.55) * 5, 8 + Math.sin(a + 0.55) * 5]], 'blade', 'flat', 1);
    }
    c.circle(8, 8, 5.4, 'blade', 'sphere');
    c.circle(8, 8, 1.6, 'iron', 'sphere');
  }),
  // vagonete
  minecart: spr(24, 16, M, 2, (c, f) => {
    c.poly([[1.5, 3], [22.5, 3], [20.5, 12], [3.5, 12]], 'cart', 'sphere');
    c.rect(1, 2, 22, 2, 'metal', 'box');
    for (const x of [7, 12, 17]) c.line(x, 5, x - 0.5, 11, 'cart', 1);
    c.circle(6, 13, 2.4, 'iron', 'sphere');
    c.circle(18, 13, 2.4, 'iron', 'sphere');
    c.set(6 + (f ? 1 : -1), 13, 'metal', 4).set(18 + (f ? -1 : 1), 13, 'metal', 4);
  }),
  // nó da corda de balanço
  knot: spr(8, 8, M, 1, (c) => {
    c.circle(4, 4, 2.8, 'rope', 'sphere');
    c.line(3, 2, 5, 6, 'rope', 1);
  }),
};
