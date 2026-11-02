/** Personagens e cenário das cenas de história, esculpidos em 16 bits. */
import type { SpriteDef } from '../../engine/sprites';
import { Canvas, Materials } from '../../engine/pixelart';

// ---------------------------------------------------------------- Dona Ondina (24x24, conteúdo nas linhas 0-20)
const OM = new Materials({ hair: '#e8e8f2', skin: ['#a8644a', '#e0a07a', '#f2c6a2', '#ffdcbe', '#fff1e2'], shawl: '#6a3a98', dress: '#3a5a9a', brooch: '#ffd24a', cheek: '#ff9a9a', glasses: '#c9ccd6' });
function ondina(bob: number): string {
  const c = new Canvas(24, 24, OM);
  const y = bob;
  // vestido e xale
  c.poly([[5, 10 + y], [18, 10 + y], [20.5, 20.5], [3.5, 20.5]], 'dress', 'sphere');
  c.poly([[5, 10 + y], [18, 10 + y], [19, 15 + y], [11.5, 17 + y], [4, 15 + y]], 'shawl', 'sphere');
  c.set(11, 14 + y, 'brooch', 4).set(12, 14 + y, 'brooch', 3).set(11, 15 + y, 'brooch', 2).set(12, 15 + y, 'brooch', 2);
  // mãos
  c.rect(3, 15 + y, 2, 2, 'skin', 'box').rect(19, 15 + y, 2, 2, 'skin', 'box');
  // cabeça: coque e cabelo branco
  c.circle(11.5, 1.8 + y, 2, 'hair', 'sphere');
  c.ellipse(11.5, 6 + y, 6, 4.8, 'hair', 'sphere');
  c.ellipse(11.5, 7 + y, 4.3, 3.6, 'skin', 'sphere');
  c.outline();
  // óculos, olhos e sorriso
  c.set(9, 7 + y, 'glasses', 3).set(14, 7 + y, 'glasses', 3).set(10, 7 + y, 'glasses', 2).set(13, 7 + y, 'glasses', 2);
  c.ink(9, 8 + y).ink(14, 8 + y);
  c.set(8, 9 + y, 'cheek', 3).set(15, 9 + y, 'cheek', 3);
  c.ink(11, 10 + y).ink(12, 10 + y);
  return c.toString();
}
export const ONDINA: SpriteDef = { palette: OM.palette(), frames: [ondina(0), ondina(1)] };

// ---------------------------------------------------------------- farol grande (24x64): frame 1 aceso
const LM = new Materials({ white: '#f4f4f8', red: '#d83a2e', stone: '#6a6f7e', lamp: '#ffe28a', dark: '#3a3f4e', glass: '#9fd8ff' });
function lighthouse(lit: boolean): string {
  const c = new Canvas(24, 64, LM);
  // torre afunilada em faixas
  for (let y = 12; y < 60; y++) {
    const half = 5 + ((y - 12) / 48) * 5;
    const band = Math.floor((y - 12) / 8) % 2 ? 'red' : 'white';
    for (let x = Math.floor(12 - half); x < Math.ceil(12 + half); x++) {
      const nx = (x + 0.5 - 12) / half;
      c.set(x, y, band, nx < -0.55 ? 3 : nx > 0.5 ? 1 : 2);
    }
  }
  // janelinhas
  for (const y of [24, 40]) c.rect(11, y, 2, 3, 'dark', 'flat');
  // galeria e lanterna
  c.rect(5, 10, 14, 2, 'dark', 'box');
  c.rect(7, 3, 10, 7, lit ? 'lamp' : 'glass', 'sphere', 1, lit ? 1 : -1);
  for (const x of [9, 12, 15]) c.line(x, 3, x, 9, 'dark', 1);
  c.poly([[6, 3.5], [12, -0.5], [18, 3.5]], 'red', 'vgrad');
  // base de pedra
  c.rect(1, 60, 22, 4, 'stone', 'box', 1);
  c.outline();
  if (lit) { c.set(11, 5, 'lamp', 4).set(12, 5, 'lamp', 4).set(11, 6, 'lamp', 4).set(12, 6, 'lamp', 4); }
  return c.toString();
}
export const LIGHTHOUSE: SpriteDef = { palette: LM.palette(), frames: [lighthouse(false), lighthouse(true)] };
