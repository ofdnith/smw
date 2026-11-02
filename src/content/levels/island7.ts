/** Ilha 7 — Farol Mestre, e a Rota das Constelações. */
import type { LevelDef } from '../../game/level/format';
import { cat, flat, empty, put, hill, stairsUp, gap, hline, vline, box, dots } from './dsl';

const H = 14;
const HT = 22;

// 7-1 Convés do Navio-Fantasma: marujos, canhões, cascos voando.
function l71(): string[] {
  const dock = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@']]);
  const deck = (() => {
    let s = flat(70, H, 3);
    // mastros e vergas
    for (const x of [10, 30, 50]) {
      s = vline(s, x, 1, H - 4, ':');
      s = hline(s, x - 4, 4, 9, '=');
      s = hline(s, x - 2, 8, 5, '=');
    }
    s = dots(s, [[6, H - 4, 'w'], [14, H - 4, 'ç'], [20, H - 4, 'w'], [26, H - 4, 'x'], [34, H - 4, 'w'], [40, H - 4, 'c'], [45, H - 4, 'ç'], [54, H - 4, 'w'], [60, H - 4, 'w'], [66, H - 4, 'x']]);
    s = dots(s, [[10, 3, 'p'], [30, 7, '$'], [31, 7, '$'], [32, 7, '$'], [50, 3, 'p'], [8, 7, '?'], [48, 7, '!']]);
    s = dots(s, [[16, 2, 'v'], [38, 2, 'v'], [58, 3, 'v']]);
    return s;
  })();
  const hold = (() => {
    // porão: sala baixa com neblina letal
    let s = flat(30, H, 2, '%');
    s = box(s, 0, 0, 30, 5, '%');
    for (let x = 4; x < 26; x++) s = vline(s, x, H - 2, 2, 'X');
    s = dots(s, [[6, H - 6, 'z'], [11, H - 7, 'z'], [16, H - 6, 'z'], [21, H - 7, 'z'], [13, H - 8, 'p']]);
    s = box(s, 26, H - 4, 4, 2, '%');
    return s;
  })();
  const end = dots(flat(16, H, 3), [[4, H - 4, 'w'], [11, H - 4, 'g']]);
  return cat(dock, deck, hold, end);
}

// 7-2 Cordame: sala alta de redes, cordas e gaivotas.
function l72(): string[] {
  const start = dots(flat(14, HT, 3), [[3, HT - 4, 's'], [7, HT - 4, '@']]);
  const rig = (() => {
    let s = flat(50, HT, 3);
    s = vline(s, 6, 2, HT - 6, 'V');
    s = vline(s, 7, 2, HT - 6, 'V');
    s = hline(s, 8, 4, 6, '=');
    s = put(s, 10, 3, 'p');
    s = hline(s, 16, 8, 6, '=');
    s = vline(s, 24, 6, 8, '|');
    s = hline(s, 25, 6, 5, '=');
    s = hline(s, 26, 12, 6, '=');
    s = vline(s, 34, 2, HT - 7, 'V');
    s = vline(s, 35, 2, HT - 7, 'V');
    s = hline(s, 36, 3, 8, '=');
    s = put(s, 40, 2, 'p');
    s = hline(s, 38, 10, 6, '=');
    s = hline(s, 40, 15, 8, '=');
    s = dots(s, [[12, 6, 'v'], [20, 10, 'v'], [28, 4, 'i'], [30, 11, 'r'], [37, 2, 'v'], [44, 14, 'w'], [10, HT - 4, 'w'], [22, HT - 4, 'c'], [32, HT - 4, 'w'], [46, HT - 4, 'u']]);
    s = dots(s, [[18, 7, '$'], [19, 7, '$'], [27, 11, '$'], [28, 11, '$'], [42, 9, '?']]);
    return s;
  })();
  const end = dots(cat(stairsUp(HT, 3, 3), flat(16, HT, 6)), [[8, HT - 7, 'w'], [12, HT - 7, 'g']]);
  return cat(start, rig, end);
}

// 7-3 Torre do Farol: subida e Capitão Brumo.
function l73(): string[][] {
  // sala 1: torre vertical (sobe)
  let a = flat(20, 40, 2, '%');
  a = box(a, 0, 0, 1, 40, '%');
  a = box(a, 19, 0, 1, 40, '%');
  a = box(a, 0, 0, 20, 1, '%');
  a = dots(a, [[3, 40 - 3, 's']]);
  const plats: [number, number, number][] = [[2, 35, 5], [10, 32, 5], [3, 29, 4], [11, 26, 5], [4, 23, 4], [11, 20, 4], [2, 17, 5], [10, 14, 5], [3, 11, 4], [11, 8, 5], [5, 5, 4]];
  for (const [x, y, w] of plats) a = hline(a, x, y, w, '=');
  a = dots(a, [[12, 31, 'w'], [13, 25, 'w'], [4, 16, 'w'], [11, 13, 'f'], [14, 7, 'p'], [8, 28, 'v'], [8, 18, 'v'], [6, 10, 'v'], [6, 22, 'c'], [2, 34, 'b'], [16, 4, 'b'], [6, 4, '1'], [15, 3, '?'], [16, 3, '0']]);
  // sala 2: arena do Capitão
  let b = flat(20, 12, 2, '%');
  b = box(b, 0, 0, 20, 1, '%');
  b = box(b, 0, 0, 1, 12, '%');
  b = box(b, 19, 0, 1, 12, '%');
  for (let y = 1; y < 12 - 3; y++) b = put(b, 3, y, ':');
  for (let y = 1; y < 12 - 3; y++) b = put(b, 15, y, ':');
  b = dots(b, [[2, 12 - 3, '1'], [14, 12 - 3, '*'], [4, 12 - 6, '='], [5, 12 - 6, '='], [14, 12 - 6, '='], [15, 12 - 6, '='], [9, 12 - 8, '='], [10, 12 - 8, '=']]);
  return [a, b];
}

// ---------- Rota das Constelações: fases-desafio.
function lc1(): string[] {
  let s = gap(80, H);
  s = box(s, 0, H - 3, 6, 3, '#');
  s = dots(s, [[2, H - 4, 's']]);
  const plats: [number, number][] = [[9, H - 5], [14, H - 7], [19, H - 5], [24, H - 8], [29, H - 6], [35, H - 9], [40, H - 6], [46, H - 8], [52, H - 5], [58, H - 7], [64, H - 9]];
  plats.forEach(([x, y], i) => { s = hline(s, x, y, 2, i % 3 === 2 ? 'F' : '='); });
  s = dots(s, [[24, H - 10, 'p'], [46, H - 10, 'p'], [64, H - 11, 'p'], [16, H - 10, 'v'], [31, H - 9, 'v'], [44, H - 11, 'v'], [56, H - 10, 'v']]);
  s = box(s, 70, H - 3, 10, 3, '#');
  s = put(s, 75, H - 4, 'g');
  return s;
}
function lc2(): string[] {
  let s = flat(90, H, 3);
  s = box(s, 0, 0, 90, 1, '%');
  s = dots(s, [[3, H - 4, 's'], [6, H - 8, '0']]);
  for (let x = 10; x < 80; x++) s = vline(s, x, H - 3, 3, '.');
  for (let x = 12; x < 78; x += 2) if ((x / 2) % 3 !== 1) s = put(s, x, H - 5 - ((x / 2) % 4), 'H');
  s = dots(s, [[20, 1, 'b'], [34, 1, 'b'], [48, 1, 'b'], [62, 1, 'b'], [30, H - 10, 'p'], [56, H - 11, 'p'], [70, H - 10, 'p'], [85, H - 4, 'g']]);
  return s;
}
function lc3(): string[] {
  let s = flat(140, H, 2);
  s = dots(s, [[3, H - 3, 's']]);
  for (let x = 8; x < 134; x++) s = put(s, x, H - 2, 'X');
  for (let x = 8; x < 134; x++) s = put(s, x, H - 1, 'X');
  const plats: [number, number, number][] = [[8, H - 4, 4], [16, H - 6, 3], [23, H - 4, 3], [30, H - 7, 3], [37, H - 5, 4], [45, H - 8, 2], [51, H - 5, 3], [58, H - 7, 3], [65, H - 4, 4], [73, H - 6, 3], [80, H - 9, 2], [86, H - 6, 3], [93, H - 4, 4], [101, H - 7, 3], [108, H - 5, 3], [115, H - 8, 2], [121, H - 5, 3], [128, H - 4, 4]];
  for (const [x, y, w] of plats) s = hline(s, x, y, w, '=');
  s = dots(s, [[17, H - 7, 'r'], [31, H - 8, 'u'], [45, H - 10, 'p'], [59, H - 8, 'r'], [80, H - 11, 'p'], [102, H - 8, 'u'], [115, H - 10, 'p'], [136, H - 3, 'g'], [40, H - 9, 'v'], [70, H - 9, 'v'], [110, H - 10, 'v']]);
  s = box(s, 134, H - 2, 6, 2, '#');
  return s;
}
function lc4(): string[] {
  const a = dots(flat(16, H, 3), [[3, H - 4, 's'], [8, H - 4, 'e'], [12, H - 8, '+']]);
  let b = flat(60, H, 3);
  b = box(b, 6, H - 6, 2, 3, 'B');
  b = box(b, 12, H - 7, 2, 4, 'B');
  for (let x = 16; x < 22; x++) b = vline(b, x, 2, H - 5, '&');
  b = hline(b, 24, H - 9, 4, '=');
  b = put(b, 25, H - 10, 'p');
  b = dots(b, [[30, H - 4, 'w'], [34, H - 4, 'f'], [38, H - 9, 'i'], [44, H - 4, 'b'], [50, H - 4, 'c']]);
  b = box(b, 54, H - 5, 4, 2, 'B');
  const c = (() => {
    let s = gap(40, H);
    s = hline(s, 0, H - 5, 3, '=');
    s = hline(s, 6, H - 7, 2, 'F');
    s = hline(s, 11, H - 9, 2, 'F');
    s = hline(s, 16, H - 7, 2, '=');
    s = hline(s, 22, H - 10, 2, 'F');
    s = hline(s, 28, H - 7, 3, '=');
    s = hline(s, 34, H - 5, 6, '#');
    s = dots(s, [[8, H - 8, 'v'], [22, H - 11, 'p'], [26, H - 10, 'v'], [36, H - 6, 'g']]);
    return s;
  })();
  return cat(a, b, c);
}

export const ISLAND7: LevelDef[] = [
  {
    id: '7-1', name: 'CONVES DO NAVIO-FANTASMA', island: 7, theme: 'navio', music: 'navio', kind: 'normal',
    rooms: [{ map: l71() }],
    signs: ['CANHOES DE AREIA ATIRAM CASCOS. PISE NUM CASCO PARA PARA-LO.'],
    hint: 'OS MARUJOS BLOQUEIAM PELA FRENTE, MAS NAO POR CIMA.',
  },
  {
    id: '7-2', name: 'CORDAME', island: 7, theme: 'navio', music: 'navio', kind: 'normal',
    rooms: [{ map: l72() }],
    signs: ['REDES: SUBA SEGURANDO CIMA. CORDAS: SO PARA CIMA E PARA BAIXO.'],
  },
  {
    id: '7-3', name: 'TORRE DO FAROL', island: 7, theme: 'farol', music: 'farol', kind: 'final', boss: 'brumo',
    rooms: [{ map: l73()[0] }, { map: l73()[1], theme: 'farol', music: 'chefefinal', lockY: 0 }],
    hint: 'O CAPITAO SOME NA NEVOA E VOLTA POR TRAS. A LUZ DA LANTERNA O FERE.',
  },
  {
    id: 'C-1', name: 'ESTRELA CADENTE', island: 8, theme: 'ceu', music: 'ceu', kind: 'desafio',
    rooms: [{ map: lc1() }],
  },
  {
    id: 'C-2', name: 'LUA MINGUANTE', island: 8, theme: 'ceu', music: 'ceu', kind: 'desafio',
    rooms: [{ map: lc2(), dark: true }],
  },
  {
    id: 'C-3', name: 'COMETA', island: 8, theme: 'ceu', music: 'ceu', kind: 'desafio',
    rooms: [{ map: lc3(), autoscroll: 0.9 }],
  },
  {
    id: 'C-4', name: 'VIA-LACTEA', island: 8, theme: 'ceu', music: 'ceu', kind: 'desafio',
    rooms: [{ map: lc4() }],
  },
];

export { empty, hill, box };
