/** Bolota, o besouro-rola: 20x16. Frames: 0 parado, 1-3 andando, 4-7 rolando. */
import type { SpriteDef, Palette } from '../../engine/sprites';

const P: Palette = {
  '.': null,
  k: '#14262a',
  g: '#3fb59a', G: '#2a8a74', l: '#8fe3cc', // casco
  d: '#1e5a4c',
  e: '#ffffff', p: '#14262a', // olhos
  s: '#f2c6a0', // chifrinho/boca
  o: '#f6a63a', // antena
};

const IDLE = `
....kkkkkkkkk.......
..kkglllgggggkk.....
.kgllgggggggGgk.kk..
kglggggggggggGgkeek.
kggggggGGGgggGkepek.
kgggGGGGGGGGGGGkeekk
kgGGGGGGGGGGGGGGkkso
kGGGGGGGGGddGGGGGksk
.kGGGdddddddGGGGGkk.
..kkdddddddddddkkk..
....kkkkkkkkkkk.....
...kdk.kdk.kdk.kdk..
...kk..kk..kk..kk...`;

const WALK1 = `
....kkkkkkkkk.......
..kkglllgggggkk.....
.kgllgggggggGgk.kk..
kglggggggggggGgkeek.
kggggggGGGgggGkepek.
kgggGGGGGGGGGGGkeekk
kgGGGGGGGGGGGGGGkkso
kGGGGGGGGGddGGGGGksk
.kGGGdddddddGGGGGkk.
..kkdddddddddddkkk..
....kkkkkkkkkkk.....
..kdk...kdk...kdk...
..kk....kk....kk....`;

const WALK2 = `
....................
....kkkkkkkkk.......
..kkglllgggggkk.....
.kgllgggggggGgk.kk..
kglggggggggggGgkeek.
kggggggGGGgggGkepek.
kgggGGGGGGGGGGGkeekk
kgGGGGGGGGGGGGGGkkso
kGGGGGGGGGddGGGGGksk
.kGGGdddddddGGGGGkk.
..kkdddddddddddkkk..
....kkkkkkkkkkk.....
...kdk.kdk.kdk.kdk..`;

const WALK3 = `
....kkkkkkkkk.......
..kkglllgggggkk.....
.kgllgggggggGgk.kk..
kglggggggggggGgkeek.
kggggggGGGgggGkepek.
kgggGGGGGGGGGGGkeekk
kgGGGGGGGGGGGGGGkkso
kGGGGGGGGGddGGGGGksk
.kGGGdddddddGGGGGkk.
..kkdddddddddddkkk..
....kkkkkkkkkkk.....
.....kdk...kdk...kdk
.....kk....kk....kk.`;

// rolando: bola com faixa que gira
const roll = (shift: number): string => {
  const rows = [
    '....kkkkkkkk....',
    '..kkggggggggkk..',
    '.kggggggggggggk.',
    '.kggggggggggggk.',
    'kggggggggggggggk',
    'kggggggggggggggk',
    'kggggggggggggggk',
    'kggggggggggggggk',
    'kggggggggggggggk',
    'kggggggggggggggk',
    '.kggggggggggggk.',
    '.kggggggggggggk.',
    '..kkggggggggkk..',
    '....kkkkkkkk....',
  ];
  // faixa diagonal d e brilho l que giram com shift
  return rows
    .map((row, y) =>
      row
        .split('')
        .map((ch, x) => {
          if (ch !== 'g') return ch;
          const v = (x + y + shift) % 8;
          if (v < 2) return 'd';
          if (v === 4) return 'l';
          return 'g';
        })
        .join(''),
    )
    .map((r) => '..' + r + '..')
    .join('\n');
};

export const BOLOTA: Record<'normal' | 'pedra' | 'seda' | 'blink', SpriteDef> = {
  normal: { palette: P, frames: [IDLE, WALK1, WALK2, WALK3, roll(0), roll(2), roll(4), roll(6)] },
  pedra: { palette: { ...P, g: '#8d8f9a', G: '#62646e', l: '#c9cbd4', d: '#3d3f47' }, frames: [IDLE, WALK1, WALK2, WALK3, roll(0), roll(2), roll(4), roll(6)] },
  seda: { palette: { ...P, g: '#d9a8e8', G: '#a56cc1', l: '#f3dcf9', d: '#6b3f8a' }, frames: [IDLE, WALK1, WALK2, WALK3, roll(0), roll(2), roll(4), roll(6)] },
  blink: { palette: P, frames: [`
kkk
kkk`] },
};
