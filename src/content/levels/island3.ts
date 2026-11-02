/** Ilha 3 — Penhasco dos Ventos: correntes de vento, Folha de Vento, pipas e polvos. */
import type { LevelDef } from '../../game/level/format';
import { cat, flat, empty, put, hill, stairsUp, stairsDown, gap, hline, vline, box, dots } from './dsl';

const H = 14;
const HT = 22; // salas altas

// 3-1 Escadaria de Pedra: rampas suaves, gaivotas, primeira Folha.
function l31(): string[] {
  const start = dots(flat(16, H, 3), [[3, H - 4, 's'], [8, H - 4, '@'], [12, H - 8, '+']]);
  // rampa suave: pares {} sobem meio tile cada
  const gentle = (() => {
    let s = flat(16, H, 3);
    for (let i = 0; i < 4; i++) {
      s = vline(s, i * 2, H - 3 - i, i, '#');
      s = vline(s, i * 2 + 1, H - 3 - i, i, '#');
      s = put(s, i * 2, H - 4 - i, '{');
      s = put(s, i * 2 + 1, H - 4 - i, '}');
    }
    s = box(s, 8, H - 7, 8, 4, '#');
    s = dots(s, [[10, H - 8, 'r'], [13, H - 11, 'v']]);
    return s;
  })();
  const down = (() => {
    let s = flat(16, H, 3);
    s = box(s, 0, H - 7, 8, 4, '#');
    for (let i = 0; i < 4; i++) {
      const col = 8 + i * 2;
      s = vline(s, col, H - 6 + i, 3 - i, '#');
      s = vline(s, col + 1, H - 6 + i, 3 - i, '#');
      s = put(s, col, H - 7 + i, '[');
      s = put(s, col + 1, H - 7 + i, ']');
    }
    s = dots(s, [[3, H - 8, 'u'], [5, H - 11, '$'], [6, H - 11, '$'], [7, H - 11, '$'], [2, H - 12, 'p']]);
    return s;
  })();
  const windGap = (() => {
    let s = gap(10, H);
    for (let x = 3; x < 7; x++) s = vline(s, x, 2, H - 2, '&');
    s = hline(s, 0, H - 4, 2, '=');
    s = hline(s, 8, H - 9, 2, '=');
    s = put(s, 4, 1, 'p');
    return s;
  })();
  const cliffs = (() => {
    let s = flat(30, H, 3);
    s = box(s, 0, H - 9, 4, 6, '#');
    s = box(s, 8, H - 6, 3, 3, '#');
    s = box(s, 14, H - 8, 3, 5, '#');
    s = box(s, 20, H - 6, 2, 3, '%');
    s = dots(s, [[9, H - 7, 'r'], [15, H - 9, 'p'], [20, H - 7, 'o'], [5, H - 4, 'c'], [12, H - 4, 'u'], [24, H - 4, 'r'], [27, H - 8, '?'], [28, H - 8, '!'], [18, H - 11, 'v']]);
    return s;
  })();
  const end = dots(cat(hill(H, 3, 2, 4), flat(14, H, 3)), [[4, H - 7, 'v'], [9, H - 4, 'r'], [16, H - 4, 'g']]);
  return cat(start, gentle, down, windGap, cliffs, end);
}

// 3-2 Moinhos: sala alta com correntes de vento e pipas.
function l32(): string[] {
  const start = dots(flat(14, HT, 3), [[3, HT - 4, 's'], [7, HT - 4, '@'], [10, HT - 8, '+']]);
  const tower = (() => {
    let s = flat(40, HT, 3);
    // colunas de vento alternadas e plataformas
    for (let x = 4; x < 7; x++) s = vline(s, x, 2, HT - 6, '&');
    s = hline(s, 8, HT - 9, 4, '=');
    s = put(s, 9, HT - 10, 'i');
    s = hline(s, 14, HT - 13, 4, '=');
    for (let x = 19; x < 22; x++) s = vline(s, x, 2, HT - 10, '&');
    s = hline(s, 23, HT - 17, 4, '=');
    s = put(s, 24, HT - 18, 'p');
    s = hline(s, 28, HT - 14, 3, '=');
    s = box(s, 32, HT - 12, 8, 9, '#');
    s = dots(s, [[34, HT - 13, 'r'], [37, HT - 13, 'c'], [36, HT - 17, '?'], [16, HT - 4, 'u'], [26, HT - 4, 'u'], [12, HT - 4, 'r'], [30, HT - 4, 'o']]);
    s = box(s, 29, HT - 5, 2, 2, '%');
    return s;
  })();
  const ridge = (() => {
    let s = flat(30, HT, 12);
    s = dots(s, [[3, HT - 13, 'v'], [6, HT - 13, 'i'], [12, HT - 13, 'r'], [15, HT - 17, '$'], [16, HT - 17, '$'], [17, HT - 17, '$'], [20, HT - 13, 'u'], [24, HT - 13, 'v']]);
    s = box(s, 8, HT - 15, 2, 3, '#');
    s = hline(s, 14, HT - 16, 5, '=');
    s = put(s, 26, HT - 19, 'p');
    s = hline(s, 25, HT - 18, 3, '=');
    return s;
  })();
  const descent = cat(stairsDown(HT, 3, 5, 2), dots(flat(16, HT, 3), [[4, HT - 4, 'r'], [11, HT - 4, 'g']]));
  return cat(start, tower, ridge, descent);
}

// 3-3 Pipas: vento global empurra; saída secreta no alto.
function l33(): string[] {
  const start = dots(flat(14, HT, 3), [[3, HT - 4, 's'], [7, HT - 4, '@'], [11, HT - 8, '+']]);
  const field = (() => {
    let s = flat(44, HT, 3);
    s = dots(s, [[6, HT - 10, 'i'], [16, HT - 12, 'i'], [26, HT - 9, 'i'], [36, HT - 12, 'i']]);
    s = hline(s, 4, HT - 6, 3, '=');
    s = hline(s, 10, HT - 9, 3, '=');
    s = hline(s, 20, HT - 7, 3, '=');
    s = hline(s, 30, HT - 10, 3, '=');
    s = dots(s, [[11, HT - 10, '$'], [12, HT - 10, '$'], [21, HT - 8, 'p'], [8, HT - 4, 'r'], [18, HT - 4, 'u'], [28, HT - 4, 'r'], [33, HT - 4, 'c'], [40, HT - 4, 'u']]);
    // secreto: corrente de vento que leva ao topo
    for (let x = 38; x < 41; x++) s = vline(s, x, 1, HT - 7, '&');
    s = hline(s, 36, 1, 6, '=');
    s = put(s, 38, 0, '9');
    return s;
  })();
  const bridge = (() => {
    let s = gap(16, HT);
    s = hline(s, 0, HT - 4, 16, '_');
    s = dots(s, [[5, HT - 5, 'v'], [10, HT - 9, 'i'], [12, HT - 5, 'r']]);
    return s;
  })();
  const end = dots(cat(hill(HT, 3, 2, 3), flat(16, HT, 3)), [[8, HT - 7, '?'], [9, HT - 7, '7'], [12, HT - 4, 'r'], [18, HT - 4, 'g']]);
  return cat(start, field, bridge, end);
}

// 3-4 Forte dos Ventos: esteiras, serras, vento.
function l34(): string[] {
  let s = flat(96, H, 2, '%');
  s = box(s, 0, 0, 96, 2, '%');
  s = dots(s, [[3, H - 3, 's'], [7, H - 3, '@']]);
  s = hline(s, 10, H - 2, 10, '>');
  s = dots(s, [[13, H - 3, '°'], [17, H - 3, '°']]);
  s = hline(s, 22, H - 2, 10, '<');
  s = dots(s, [[26, H - 3, '¬']]);
  s = box(s, 34, H - 5, 2, 3, '%');
  s = put(s, 38, H - 3, 'c');
  for (let x = 42; x < 56; x++) s = vline(s, x, H - 2, 2, 'X');
  s = dots(s, [[44, H - 7, 'm'], [50, H - 9, 'm'], [47, H - 11, 'p']]);
  s = box(s, 56, H - 4, 3, 2, '%');
  for (let x = 60; x < 63; x++) s = vline(s, x, 2, H - 4, '&');
  s = hline(s, 64, H - 9, 4, '=');
  s = hline(s, 70, H - 6, 4, '=');
  s = dots(s, [[65, H - 10, 'w'], [71, H - 7, 'w'], [76, H - 3, '¬'], [80, H - 3, 'w'], [84, H - 7, '?'], [85, H - 7, '+'], [90, H - 3, 'g']]);
  return s;
}

// 3-5 Farol do Penhasco: Barão Cata-Vento.
function l35(): string[][] {
  let a = flat(44, H, 3);
  a = dots(a, [[3, H - 4, 's'], [8, H - 8, '+'], [12, H - 4, 'r'], [18, H - 9, 'i'], [22, H - 4, 'c'], [28, H - 4, 'o'], [34, H - 4, 'u'], [40, H - 4, '1']]);
  a = box(a, 28, H - 6, 2, 3, '%');
  let b = flat(20, 14, 2, '%');
  b = box(b, 0, 0, 20, 1, '%');
  b = box(b, 0, 0, 1, 14, '%');
  b = box(b, 19, 0, 1, 14, '%');
  for (let x = 4; x < 6; x++) b = vline(b, x, 2, 10, '&');
  for (let x = 14; x < 16; x++) b = vline(b, x, 2, 10, '&');
  b = dots(b, [[2, 14 - 3, '1'], [10, 14 - 3, '*'], [8, 14 - 7, '='], [9, 14 - 7, '='], [10, 14 - 7, '='], [11, 14 - 7, '=']]);
  return [a, b];
}

export const ISLAND3: LevelDef[] = [
  {
    id: '3-1', name: 'ESCADARIA DE PEDRA', island: 3, theme: 'penhasco', music: 'penhasco', kind: 'normal',
    rooms: [{ map: l31() }],
    signs: ['A FOLHA DE VENTO: SEGURE Z NO AR PARA PLANAR. BAIXO + Z NO AR DA UMA RAJADA PARA CIMA!'],
    hint: 'COM O IMPETO CHEIO E A FOLHA, APERTE Z NO AR PARA VOAR BAIXO.',
  },
  {
    id: '3-2', name: 'MOINHOS', island: 3, theme: 'penhasco', music: 'penhasco', kind: 'normal',
    rooms: [{ map: l32() }],
    signs: ['CORRENTES DE VENTO LEVAM PARA CIMA. PIPAS-ESPINHO NAO MORREM: DESVIE OU USE A CAMBALHOTA.'],
  },
  {
    id: '3-3', name: 'PIPAS', island: 3, theme: 'penhasco', music: 'penhasco', kind: 'normal', hasSecret: true,
    rooms: [{ map: l33(), wind: 0.01 }],
    signs: ['O VENTO EMPURRA PARA A DIREITA. A PORTA DOURADA FICA ONDE O VENTO SOBE.'],
    hint: 'PERTO DO SINO, UMA CORRENTE SOBE ATE O CEU.',
  },
  {
    id: '3-4', name: 'FORTE DOS VENTOS', island: 3, theme: 'forte', music: 'forte', kind: 'forte',
    rooms: [{ map: l34() }],
    signs: ['ESTEIRAS EMPURRAM OS PES. CORRA CONTRA ELAS!'],
  },
  {
    id: '3-5', name: 'FAROL DO PENHASCO', island: 3, theme: 'penhasco', music: 'penhasco', kind: 'farol', boss: 'catavento',
    rooms: [{ map: l35()[0] }, { map: l35()[1], theme: 'forte', music: 'chefe', lockY: 0 }],
    hint: 'QUANDO AS PAS DO BARAO PARAM, SUBA PELO VENTO E PISE NO EIXO.',
  },
];

export { empty, stairsUp };
