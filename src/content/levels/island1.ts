/** Ilha 1 — Praia do Sino. */
import type { LevelDef } from '../../game/level/format';
import { cat, flat, empty, put, hill, stairsUp, stairsDown, gap, pool, hline, box, dots } from './dsl';

const H = 14;

// ---------- 1-1 Dunas do Sino: ensina correr, pular e pisar.
function l11(): string[] {
  const start = dots(flat(22, H, 3), [[3, H - 4, 's'], [9, H - 4, '@'], [16, H - 4, 'r']]);
  const hill1 = put(hill(H, 3, 2, 6), 4, H - 6, 'r');
  const blocks = dots(flat(14, H, 3), [[3, H - 8, '?'], [4, H - 8, '?'], [5, H - 8, '!'], [6, H - 8, '?'], [9, H - 4, 'r'], [11, H - 4, 'r']]);
  const g1 = gap(3, H);
  const stairs = cat(stairsUp(H, 3, 3), dots(flat(6, H, 6), [[2, H - 7, 'v'], [1, H - 10, '$'], [2, H - 10, '$'], [3, H - 10, '$']]), stairsDown(H, 3, 3));
  const g2 = put(put(gap(5, H), 1, H - 7, '==='), 2, H - 8, 'u');
  const run2 = dots(flat(18, H, 3), [[2, H - 4, 'c'], [7, H - 9, '='], [8, H - 9, '='], [9, H - 9, '='], [8, H - 10, 'p'], [12, H - 4, 'r'], [15, H - 4, 'u']]);
  const water = cat(put(flat(3, H, 3), 2, H - 4, '\\'), pool(8, H, 1, 2), put(flat(3, H, 3), 0, H - 4, '/'));
  const water2 = dots(water, [[6, H - 3, 'ª']]);
  const high = dots(flat(16, H, 3), [[2, H - 8, 'B'], [3, H - 8, 'B'], [4, H - 8, '?'], [5, H - 8, 'B'], [8, H - 4, 'y'], [8, H - 11, '$'], [9, H - 12, '$'], [10, H - 13, 'p'], [13, H - 4, 'v']]);
  const g3 = put(gap(4, H), 1, H - 6, '==');
  const end = dots(flat(22, H, 3), [[2, H - 4, 'r'], [5, H - 4, 'r'], [9, H - 8, '?'], [15, H - 4, 'g']]);
  return cat(start, hill1, blocks, g1, stairs, g2, run2, water2, high, g3, end);
}

// ---------- 1-2 Coqueiral: plataformas, gaivotas, primeiro casco chutado.
function l12(): string[] {
  const start = dots(flat(16, H, 3), [[3, H - 4, 's'], [8, H - 4, '@'], [12, H - 4, 'r']]);
  const plats = (() => {
    let s = flat(26, H, 2);
    s = hline(s, 3, H - 6, 4, '=');
    s = hline(s, 9, H - 8, 4, '=');
    s = hline(s, 15, H - 10, 4, '=');
    s = hline(s, 21, H - 8, 4, '=');
    s = dots(s, [[10, H - 9, '$'], [11, H - 9, '$'], [16, H - 11, '$'], [17, H - 11, '$'], [16, H - 3, 'u'], [6, H - 3, 'r'], [22, H - 9, 'p'], [12, H - 12, 'v']]);
    return s;
  })();
  const gapA = put(gap(4, H), 1, H - 5, 'm');
  const cannonRun = dots(flat(20, H, 3), [[2, H - 4, 'ç'], [6, H - 4, 'r'], [10, H - 8, '?'], [11, H - 8, '!'], [12, H - 8, '?'], [16, H - 4, 'c']]);
  const hills = cat(hill(H, 3, 3, 4), put(flat(4, H, 3), 1, H - 4, 'r'), hill(H, 3, 2, 3));
  const hillsE = dots(hills, [[6, H - 8, 'v'], [4, H - 8, '$'], [5, H - 8, '$'], [6, H - 8, '$']]);
  const towers = (() => {
    let s = flat(24, H, 2);
    s = box(s, 3, H - 5, 2, 3, '#');
    s = box(s, 5, H - 4, 4, 2, '#'); // fosso raso
    s = box(s, 9, H - 7, 2, 5, '#');
    s = box(s, 11, H - 6, 4, 4, '#');
    s = box(s, 15, H - 9, 3, 7, '#');
    s = box(s, 18, H - 4, 3, 2, '#');
    s = box(s, 21, H - 6, 2, 4, '#');
    s = dots(s, [[3, H - 6, 'r'], [9, H - 8, 'u'], [16, H - 10, 'p'], [6, H - 8, '$'], [12, H - 10, '$'], [19, H - 11, '$'], [19, H - 5, 'u'], [6, H - 5, 'r']]);
    return s;
  })();
  const g3 = put(gap(5, H), 2, H - 7, 'q');
  const end = dots(flat(20, H, 3), [[3, H - 4, 'r'], [5, H - 4, 'r'], [8, H - 8, '?'], [9, H - 8, '?'], [14, H - 4, 'g']]);
  return cat(start, plats, gapA, cannonRun, hillsE, towers, g3, end);
}

// ---------- 1-3 Gruta da Maré: tem saída secreta (chave + fechadura numa gruta).
function l13(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [8, H - 4, '@']]);
  const beach = dots(cat(hill(H, 3, 2, 5), flat(8, H, 3)), [[4, H - 6, 'r'], [10, H - 4, 'u'], [5, H - 9, '$'], [6, H - 9, '$']]);
  const water = cat(put(flat(2, H, 3), 1, H - 4, '\\'), dots(pool(12, H, 1, 2), [[3, H - 3, 'ª'], [8, H - 3, 'ª'], [5, H - 7, '='], [6, H - 7, '='], [6, H - 8, 'p']]), put(flat(2, H, 3), 0, H - 4, '/'));
  // gruta: entrada por baixo, teto de rocha; chave escondida atrás de blocos rachados
  const cave = (() => {
    let s = flat(30, H, 3);
    s = box(s, 0, 0, 30, 3, '%');
    s = box(s, 0, 3, 30, 1, '%');
    s = box(s, 6, H - 7, 3, 4, '%');
    s = box(s, 14, H - 9, 2, 6, '%');
    s = box(s, 22, H - 7, 3, 4, '%');
    s = dots(s, [[4, H - 4, 'c'], [10, H - 4, 'u'], [12, H - 4, 'r'], [18, H - 4, 'r'], [7, H - 8, '$'], [15, H - 10, '$'], [23, H - 8, '$'], [20, H - 4, 'B'], [20, H - 5, 'B'], [21, H - 4, 'B'], [21, H - 5, 'B'], [27, H - 4, 'k'], [26, H - 5, 'B'], [27, H - 5, 'B'], [28, H - 5, 'B'], [26, H - 6, 'B'], [27, H - 6, 'B'], [28, H - 6, 'B']]);
    return s;
  })();
  const outDoor = dots(flat(10, H, 3), [[3, H - 4, 'l'], [7, H - 8, '?']]);
  const g1 = put(gap(4, H), 1, H - 6, '==');
  const dunes = dots(cat(hill(H, 3, 2, 3), flat(5, H, 3), hill(H, 3, 3, 2)), [[3, H - 6, 'r'], [9, H - 4, 'u'], [15, H - 7, 'v'], [10, H - 9, '!']]);
  const end = dots(flat(18, H, 3), [[3, H - 4, 'r'], [12, H - 4, 'g']]);
  return cat(start, beach, water, cave, outDoor, g1, dunes, end);
}

// ---------- 1-S Enseada Escondida: fase bônus de pérolas com molas.
function l1s(): string[] {
  let s = flat(60, H, 3);
  s = dots(s, [[3, H - 4, 's'], [8, H - 4, 'y'], [8, H - 12, 'p']]);
  for (let i = 0; i < 8; i++) s = put(s, 12 + i, H - 11 + (i % 2), '$');
  s = hline(s, 14, H - 8, 6, '=');
  s = dots(s, [[22, H - 4, 'y'], [22, H - 13, 'p'], [26, H - 4, 'r'], [30, H - 8, '?'], [31, H - 8, '?'], [32, H - 8, '!'], [36, H - 4, 'y'], [40, H - 9, '='], [41, H - 9, '='], [42, H - 9, '='], [41, H - 10, 'p'], [46, H - 4, 'v'], [54, H - 4, 'g']]);
  return s;
}

// ---------- 1-4 Forte de Areia: serras, chamas, blocos rachados.
function l14(): string[] {
  const H2 = 14;
  let s = flat(90, H2, 2, '%');
  s = box(s, 0, 0, 90, 2, '%');
  s = dots(s, [[3, H2 - 3, 's'], [7, H2 - 3, '@']]);
  // corredor com serras
  s = box(s, 12, H2 - 5, 8, 3, '%');
  s = put(s, 13, H2 - 6, '¬');
  s = dots(s, [[14, H2 - 3, '°'], [17, H2 - 3, '°']]);
  s = hline(s, 22, H2 - 5, 3, '=');
  s = hline(s, 27, H2 - 8, 3, '=');
  s = dots(s, [[28, H2 - 9, 'p'], [30, H2 - 3, '¬']]);
  s = box(s, 34, H2 - 9, 2, 7, '%');
  s = put(s, 36, H2 - 3, 'c');
  s = box(s, 40, H2 - 5, 10, 1, 'B');
  s = dots(s, [[42, H2 - 3, '°'], [46, H2 - 3, '°'], [44, H2 - 9, '!']]);
  s = box(s, 52, H2 - 5, 6, 3, '%');
  s = put(s, 54, H2 - 6, '¬');
  s = hline(s, 60, H2 - 7, 4, '=');
  s = hline(s, 66, H2 - 10, 4, '=');
  s = dots(s, [[67, H2 - 11, 'p'], [63, H2 - 3, '¬'], [70, H2 - 3, 'w'], [74, H2 - 3, 'u'], [78, H2 - 6, '?'], [84, H2 - 3, 'g']]);
  // lava de sal no fosso
  s = box(s, 58, H2 - 2, 6, 2, 'X');
  return s;
}

// ---------- 1-5 Farol do Sino: arena do Rei Siri (sala pequena).
function l15(): string[][] {
  // sala 1: aproximação
  let a = flat(40, H, 3);
  a = dots(a, [[3, H - 4, 's'], [10, H - 4, 'r'], [14, H - 8, '?'], [15, H - 8, '!'], [20, H - 4, 'c'], [26, H - 4, 'u'], [36, H - 4, '1']]);
  // sala 2: arena 20x12 fechada
  let b = flat(20, 12, 2, '%');
  b = box(b, 0, 0, 20, 1, '%');
  b = box(b, 0, 0, 1, 12, '%');
  b = box(b, 19, 0, 1, 12, '%');
  b = dots(b, [[2, 12 - 3, '1'], [15, 12 - 3, '*'], [9, 12 - 7, '?'], [10, 12 - 7, '?'], [6, 12 - 5, '='], [7, 12 - 5, '='], [12, 12 - 5, '='], [13, 12 - 5, '=']]);
  return [a, b];
}

export const ISLAND1: LevelDef[] = [
  {
    id: '1-1', name: 'DUNAS DO SINO', island: 1, theme: 'praia', music: 'praia', kind: 'normal',
    rooms: [{ map: l11() }],
    signs: ['SETAS: ANDAR. SEGURE X PARA CORRER. Z PULA! PULE EM CIMA DOS CARANGUEJOS.'],
    hint: 'QUANTO MAIS ALTO TOCAR O ARCO, MAIS AMBAR.',
  },
  {
    id: '1-2', name: 'COQUEIRAL', island: 1, theme: 'praia', music: 'praia', kind: 'normal',
    rooms: [{ map: l12() }],
    signs: ['PISE NUM CARANGUEJO E ELE SE ESCONDE. SEGURE X PARA CARREGAR A CONCHA E SOLTE PARA CHUTAR!'],
  },
  {
    id: '1-3', name: 'GRUTA DA MARE', island: 1, theme: 'praia', music: 'praia', kind: 'normal', hasSecret: true,
    rooms: [{ map: l13() }],
    signs: ['C FAZ A CAMBALHOTA: QUEBRA BLOCOS RACHADOS AO CAIR. DIZEM QUE HA UMA CHAVE NA GRUTA...'],
    hint: 'A CHAVE ABRE A PORTA DE PEDRA. CARREGUE-A COM CUIDADO.',
  },
  {
    id: '1-S', name: 'ENSEADA ESCONDIDA', island: 1, theme: 'praia', music: 'ceu', kind: 'normal',
    rooms: [{ map: l1s() }],
  },
  {
    id: '1-4', name: 'FORTE DE AREIA', island: 1, theme: 'forte', music: 'forte', kind: 'forte',
    rooms: [{ map: l14() }],
    signs: ['SERRAS E CHAMAS NAO PODEM SER PISADAS. A CAMBALHOTA (C) QUICA EM CIMA DELAS!'],
  },
  {
    id: '1-5', name: 'FAROL DO SINO', island: 1, theme: 'praia', music: 'praia', kind: 'farol', boss: 'reisiri',
    rooms: [{ map: l15()[0] }, { map: l15()[1], theme: 'forte', music: 'chefe', lockY: 0 }],
    hint: 'O REI SIRI CRAVA A GARRA NO CHAO E FICA PRESO. E A SUA CHANCE!',
  },
];

export { empty };
