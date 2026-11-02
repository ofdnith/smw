/** Itens e objetos de fase, esculpidos em 16 bits. Mesmas dimensões e âncoras dos originais. */
import type { SpriteDef } from '../../engine/sprites';
import { Canvas, Materials } from '../../engine/pixelart';

type Draw = (c: Canvas, f: number) => void;
function spr(w: number, h: number, mats: Materials, frames: number, fn: Draw, post?: Draw, outline = true): SpriteDef {
  const out: string[] = [];
  for (let f = 0; f < frames; f++) {
    const c = new Canvas(w, h, mats);
    fn(c, f);
    if (outline) c.outline();
    post?.(c, f);
    out.push(c.toString());
  }
  return { palette: mats.palette(), frames: out };
}

const M = new Materials({
  shell: '#f7a8c4', leaf: '#8ed65a', glass: '#9fd8ff', metal: '#b0956a', flame: '#ffffff', blue: '#4aa8f0',
  feather: '#f4f6ff', quill: '#a9b4c8', pearl: '#e8f0ff', gold: '#ffcc3a', stone: '#8a8f9e', wood: '#a8743e',
  amber: '#ff9a2a', orb: '#bfe8ff', green: '#5fcf6f', red: '#e8423a', rope: '#d8b070',
});

const star = (c: Canvas, cx: number, cy: number, mat: string, tone: number): void => {
  c.set(cx, cy - 2, mat, tone).set(cx, cy - 1, mat, tone).set(cx - 2, cy, mat, tone).set(cx - 1, cy, mat, tone).set(cx, cy, mat, tone).set(cx + 1, cy, mat, tone).set(cx + 2, cy, mat, tone).set(cx - 1, cy + 1, mat, tone).set(cx + 1, cy + 1, mat, tone).set(cx - 2, cy + 2, mat, tone).set(cx + 2, cy + 2, mat, tone);
};

export const ITEMS: Record<string, SpriteDef> = {
  // Concha-Escudo: leque com estrias
  shell: spr(16, 11, M, 1, (c) => {
    c.ellipse(8, 6, 6.5, 4.6, 'shell', 'sphere');
    for (let x = 0; x < 16; x++) for (let y = 7; y < 11; y++) if (y > 8 + Math.abs(x - 8) * 0.3) c.clear(x, y);
    c.rect(6, 8, 4, 2, 'shell', 'box', 1, -1);
    for (const x of [4, 6, 8, 10, 12]) c.line(8, 9, x, 3, 'shell', 1);
    c.set(6, 3, 'shell', 4).set(7, 2, 'shell', 4);
  }),
  // Folha de Vento
  leaf: spr(16, 11, M, 2, (c, f) => {
    const t = f ? 1 : 0;
    c.poly([[1, 9 - t], [5, 3], [10, 0.5 + t], [15, 1], [12, 6], [6, 10]], 'leaf', 'sphere');
    c.line(2, 9 - t, 13, 2, 'leaf', 1);
    for (const x of [5, 8, 11]) c.line(x, 8 - x * 0.5 + 2, x + 1, 5 - x * 0.3, 'leaf', 1);
    c.set(6, 4, 'leaf', 4).set(8, 3, 'leaf', 4);
  }),
  // Lanterna Viva
  lantern: spr(16, 13, M, 2, (c, f) => {
    c.line(6, 1, 10, 1, 'metal', 2).line(8, 0, 8, 1, 'metal', 1);
    c.rect(5, 2, 6, 2, 'metal', 'box');
    c.rect(4, 4, 8, 7, 'glass', 'sphere', 1);
    c.rect(5, 11, 6, 1, 'metal', 'box');
    c.ellipse(8, 7.5, 1.6, 2.2 + (f ? 0.4 : 0), 'blue', 'flat', 1);
    c.set(8, 7, 'flame', 4).set(8, 8, 'flame', 4);
    c.line(5, 5, 5, 9, 'glass', 4);
  }),
  // Pena de Gaivota
  feather: spr(16, 12, M, 1, (c) => {
    c.poly([[2, 11], [5, 6], [10, 1.5], [14.5, 0.5], [12, 5], [7, 9.5]], 'feather', 'sphere');
    c.line(1, 11.5, 13, 1, 'quill', 1);
    for (const x of [6, 9, 11]) c.set(x, 11 - x * 0.85, 'quill', 2);
  }),
  // Pérola da Maré (brilho girando)
  pearl: spr(10, 10, M, 4, (c) => {
    c.circle(5, 5, 3.8, 'pearl', 'sphere');
  }, (c, f) => {
    const pts: [number, number][] = [[3, 3], [6, 2], [7, 5], [4, 6]];
    const [x, y] = pts[f];
    c.set(x, y, 'pearl', 4).set(3, 3, 'pearl', 4);
    if (f === 1) c.set(8, 1, 'flame', 4);
  }),
  // Chave de pedra
  key: spr(8, 13, M, 1, (c) => {
    c.circle(4, 3, 2.8, 'gold', 'sphere');
    c.set(4, 3, 'gold', 0);
    c.rect(3, 5, 2, 7, 'gold', 'box');
    c.rect(5, 9, 2, 1, 'gold', 'box').rect(5, 11, 2, 1, 'gold', 'box');
  }),
  // Porta de pedra com fechadura
  lock: spr(16, 32, M, 2, (c, f) => {
    c.rect(1, 1, 14, 31, 'stone', 'box', 4);
    for (let y = 6; y < 31; y += 6) c.line(2, y, 13, y, 'stone', 1);
    for (let y = 1; y < 31; y += 6) c.set(8 + ((y / 6) % 2 ? 0 : 0), y + 2, 'stone', 1);
    c.rect(5, 13, 6, 7, 'gold', 'sphere', 1, f ? 1 : 0);
    c.set(8, 15, 'stone', 0).set(8, 16, 'stone', 0).set(7, 17, 'stone', 0).set(8, 17, 'stone', 0).set(9, 17, 'stone', 0);
  }),
  // Bandeirola do arco
  flag: spr(8, 5, M, 2, (c, f) => {
    c.poly([[0.5, 0.5], [7.5, f ? 1.5 : 0.5], [7.5, f ? 4 : 3.5], [0.5, 4.5]], 'red', 'vgrad');
    c.set(3, 2, 'gold', 4);
  }, undefined, false),
  // Gota de âmbar (gira)
  amber: spr(8, 7, M, 4, (c, f) => {
    const w = [3, 1.6, 3, 1.6][f];
    c.ellipse(4, 3.6, w, 3, 'amber', 'sphere');
  }, (c, f) => { c.set(f === 1 ? 4 : 3, 2, 'amber', 4); }),
  // Orbe de luz
  orb: spr(8, 8, M, 2, (c, f) => {
    c.circle(4, 4, f ? 3.2 : 2.8, 'orb', 'sphere', 1);
    c.set(3, 3, 'flame', 4);
  }, undefined, false),
  // Porta dourada (saída secreta)
  goldDoor: spr(16, 32, M, 2, (c, f) => {
    c.rect(1, 1, 14, 31, 'gold', 'box', 6);
    c.rect(3, 6, 10, 25, 'gold', 'flat', 3, -1);
    star(c, 8, 13, 'flame', f ? 4 : 3);
    c.set(11, 20, 'wood', 1).set(11, 21, 'wood', 1);
    c.line(2, 8, 2, 28, 'gold', 4);
  }),
};

// ---------------------------------------------------------------- sino (12x32): sino no topo, poste até o chão
const BM = new Materials({ pole: '#8a6a4a', bronze: '#a8a8b8', gold: '#ffcc3a', base: '#5f4630' });
const bell = (lit: boolean): Draw => (c) => {
  c.rect(5, 12, 2, 18, 'pole', 'cyl');
  c.rect(3, 30, 6, 2, 'base', 'box');
  c.rect(5, 0, 2, 3, 'pole', 'cyl');
  c.poly([[3.5, 3.5], [8.5, 3.5], [10.5, 10], [11.5, 11.5], [0.5, 11.5], [1.5, 10]], lit ? 'gold' : 'bronze', 'sphere');
  c.rect(5, 12, 2, 1, lit ? 'gold' : 'bronze', 'flat', 0, -1);
};
export const BELL: SpriteDef = spr(12, 32, BM, 2, (c, f) => bell(f === 1)(c, f), (c, f) => { c.set(3, 6, f ? 'gold' : 'bronze', 4).set(3, 7, f ? 'gold' : 'bronze', 4); });

// ---------------------------------------------------------------- arco de chegada (32x64)
const AM = new Materials({ post: '#a8743e', rope: '#e0b878', flag1: '#e8423a', flag2: '#4aa8f0', flag3: '#ffd24a', cap: '#ffcc3a' });
export const GOAL_ARCH: SpriteDef = spr(32, 64, AM, 1, (c) => {
  for (const x0 of [1, 27]) {
    c.rect(x0 + 1, 2, 3, 61, 'post', 'cyl');
    for (let y = 8; y < 60; y += 8) c.line(x0 + 1, y, x0 + 3, y, 'post', 1);
    c.circle(x0 + 2.5, 2.5, 2.4, 'cap', 'sphere');
  }
}, (c) => {
  // corda e bandeirolas penduradas
  for (let x = 5; x < 27; x++) {
    const sag = Math.round(Math.sin(((x - 5) / 21) * Math.PI) * 5);
    c.set(x, 3 + sag, 'rope', 3).set(x, 4 + sag, 'rope', 1);
    if ((x - 6) % 5 === 0) {
      const fl = ['flag1', 'flag2', 'flag3'][((x - 6) / 5) % 3];
      c.set(x, 5 + sag, fl, 3).set(x + 1, 5 + sag, fl, 2).set(x, 6 + sag, fl, 2).set(x + 1, 6 + sag, fl, 1).set(x, 7 + sag, fl, 1);
    }
  }
});

// ---------------------------------------------------------------- faroleiro-fantasma (16x24)
const GM = new Materials({ ghost: '#dfeaff', cap: '#3a5a9a', lamp: '#ffe08a' });
export const GHOST: SpriteDef = spr(16, 24, GM, 2, (c, f) => {
  c.ellipse(8, 9, 6, 6, 'ghost', 'sphere');
  c.poly([[2, 9], [14, 9], [14, 20], [12, 23 - f], [10, 20], [8, 23 - (1 - f)], [6, 20], [4, 23 - f], [2, 20]], 'ghost', 'sphere');
  c.rect(4, 1, 8, 3, 'cap', 'box', 1);
  c.rect(3, 3, 9, 1, 'cap', 'flat', 0, -1);
  c.ink(6, 8).ink(10, 8).ink(6, 9).ink(10, 9);
  c.line(7, 12, 9, 12, 'ghost', 1);
  // braço segurando um lampião
  c.line(13, 12, 15, 14, 'ghost', 2, 2);
}, (c) => { c.set(14, 15, 'lamp', 4).set(15, 15, 'lamp', 3).set(14, 16, 'lamp', 3).set(15, 16, 'lamp', 2); });

// ---------------------------------------------------------------- placa (16x16)
const SM = new Materials({ wood: '#b07a42', ink: '#5a3a1a' });
export const SIGN: SpriteDef = spr(16, 16, SM, 1, (c) => {
  c.rect(7, 9, 2, 7, 'wood', 'cyl', 0, -1);
  c.rect(1, 1, 14, 9, 'wood', 'box', 1);
  for (const y of [3, 5, 7]) c.line(3, y, 12 - (y === 7 ? 3 : 0), y, 'ink', 1);
});
