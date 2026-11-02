/** Ícones do mapa-múndi, esculpidos em 16 bits (mesmas âncoras dos originais). */
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
  pole: '#a8743e', open: '#f04a3a', done: '#3fa7f0', secret: '#ffd24a', white: '#f4f4f8', red: '#d83a2e', stone: '#8a7aa0',
  roof: '#5a4a7a', lamp: '#ffe28a', glass: '#9fd8ff', tent: '#f5a8c4', stripe: '#ffffff', wood: '#b07a42', sail: '#f4f0e0',
  shell: '#ffe0b0', booth: '#e85d4a', blue: '#2f6fb8', gold: '#ffd24a', base: '#3a3f4e',
});

export const MAP_ICONS: Record<string, SpriteDef> = {
  // bandeira de fase: 0 aberta (vermelha), 1 concluída (azul), 2 saída secreta (dourada)
  level: spr(12, 12, M, 3, (c, f) => {
    c.rect(1, 1, 2, 9, 'pole', 'cyl');
    const cloth = ['open', 'done', 'secret'][f];
    c.poly([[3, 1], [9.5, 2.5], [3, 6]], cloth, 'vgrad');
    c.rect(0, 10, 4, 1, 'base', 'box');
  }, (c, f) => { if (f === 2) c.set(10, 0, 'white', 4).set(11, 1, 'gold', 4); }),
  // forte: castelinho com ameias (1 = conquistado, bandeira azul)
  forte: spr(16, 16, M, 2, (c, f) => {
    c.rect(1, 2, 14, 7, 'stone', 'box', 0);
    for (const x of [1, 5, 9, 13]) c.rect(x, 0, 2, 2, 'stone', 'box');
    c.rect(6, 5, 4, 4, 'roof', 'flat', 2, -1);
    if (f) { c.line(8, -1, 8, 0, 'pole', 2); }
  }, (c, f) => { if (f) c.set(9, 0, 'done', 3).set(10, 0, 'done', 2); }),
  // farol: 0 apagado, 1 aceso, 2 aceso com feixes
  farol: spr(16, 24, M, 3, (c, f) => {
    for (let y = 5; y < 16; y++) {
      const half = 2 + ((y - 5) / 11) * 3;
      const band = Math.floor((y - 5) / 3) % 2 ? 'red' : 'white';
      for (let x = Math.floor(8 - half); x < Math.ceil(8 + half); x++) c.set(x, y, band, x < 7 ? 3 : x > 8 ? 1 : 2);
    }
    c.rect(4, 4, 8, 1, 'base', 'flat');
    c.rect(5, 1, 6, 3, f ? 'lamp' : 'glass', 'sphere', 1, f ? 1 : -1);
    c.rect(2, 16, 12, 1, 'base', 'box');
  }, (c, f) => {
    if (f === 2) { c.set(0, 0, 'lamp', 4).set(1, 1, 'lamp', 3).set(15, 0, 'lamp', 4).set(14, 1, 'lamp', 3).set(2, 2, 'lamp', 2).set(13, 2, 'lamp', 2); }
  }),
  // Tenda da Ondina
  tent: spr(16, 12, M, 1, (c) => {
    c.poly([[8, 0.5], [15, 9.5], [1, 9.5]], 'tent', 'sphere');
    for (const x of [4, 8, 12]) c.line(8, 1, x, 9, 'stripe', 3);
    c.poly([[8, 4], [10, 9.5], [6, 9.5]], 'roof', 'flat', -1);
    c.rect(1, 9, 14, 1, 'tent', 'flat', 0, -1);
  }),
  // Cassino de Conchas: quiosque listrado com concha no topo
  casino: spr(16, 14, M, 2, (c, f) => {
    c.ellipse(8, 2.5, 4.5, 2, 'shell', 'sphere');
    for (let x = 3; x < 13; x++) c.set(x, 5, (x + f) % 2 ? 'blue' : 'stripe', 2).set(x, 6, (x + f) % 2 ? 'stripe' : 'blue', 2);
    c.rect(2, 4, 12, 1, 'booth', 'flat', 0, -1);
    c.rect(3, 7, 10, 5, 'booth', 'box');
    c.rect(5, 8, 6, 3, f ? 'gold' : 'white', 'flat', 0, f ? 1 : 0);
    c.set(7, 9, 'base', 2).set(8, 9, 'base', 2);
  }),
  // cais de partida: barquinho com vela
  dock: spr(16, 16, M, 1, (c) => {
    c.rect(6, 1, 1, 9, 'pole', 'flat');
    c.poly([[7, 1], [12.5, 8], [7, 8]], 'sail', 'sphere');
    c.poly([[1.5, 9], [14.5, 9], [12.5, 12.5], [3.5, 12.5]], 'wood', 'sphere');
    c.rect(2, 9, 12, 1, 'wood', 'flat', 0, 1);
  }),
};
