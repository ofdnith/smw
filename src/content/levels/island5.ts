/** Ilha 5 — Minas de Sal: vagonetes, toupeiras, gelo de sal e Bolotas Pedra/Seda. */
import type { LevelDef } from '../../game/level/format';
import { cat, flat, empty, put, hill, stairsUp, stairsDown, gap, pool, hline, vline, box, dots } from './dsl';

const H = 14;

// 5-1 Galeria Branca: toupeiras e a Bolota Pedra (anda no fundo da água).
function l51(): string[] {
  const start = dots(flat(18, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [12, H - 4, 'e']]);
  const gallery = (() => {
    let s = flat(40, H, 3);
    s = box(s, 0, 0, 40, 2, '%');
    s = dots(s, [[6, H - 4, 't'], [14, H - 4, 't'], [24, H - 4, 't'], [32, H - 4, 't']]);
    s = box(s, 10, H - 7, 2, 4, 'B');
    s = box(s, 18, H - 6, 3, 3, '#');
    s = dots(s, [[19, H - 7, 'p'], [27, H - 8, '?'], [28, H - 8, '?'], [29, H - 8, '!'], [36, H - 4, 'c']]);
    return s;
  })();
  const water = cat(put(flat(2, H, 3), 1, H - 4, '\\'), dots(pool(14, H, 1, 4), [[4, H - 4, 'ª'], [9, H - 3, 'ª'], [7, H - 3, 'p'], [11, H - 8, '='], [12, H - 8, '=']]), put(flat(2, H, 3), 0, H - 4, '/'));
  const crystals = (() => {
    let s = flat(24, H, 3);
    s = hline(s, 4, H - 4, 8, 'I');
    s = box(s, 14, H - 6, 2, 3, '%');
    s = hline(s, 18, H - 8, 4, '=');
    s = dots(s, [[8, H - 5, 't'], [19, H - 9, 'p'], [20, H - 4, 'u']]);
    return s;
  })();
  const end = dots(cat(stairsUp(H, 3, 3), flat(14, H, 6)), [[8, H - 7, 't'], [12, H - 7, 'g']]);
  return cat(start, gallery, water, crystals, end);
}

// 5-2 Vagonetes: trilhos sobre o abismo.
function l52(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [11, H - 4, 'a']]);
  const rail = (() => {
    let s = gap(60, H);
    // trilho: chão de 1 linha com buracos
    s = hline(s, 0, H - 3, 60, '#');
    for (const x of [8, 9, 18, 19, 20, 30, 31, 42, 43, 44]) s = put(s, x, H - 3, '.');
    s = dots(s, [[12, H - 7, '$'], [13, H - 7, '$'], [14, H - 7, '$'], [24, H - 8, 'p'], [36, H - 7, '$'], [37, H - 7, '$'], [48, H - 8, 'p'], [26, H - 5, 'v'], [40, H - 5, 'v']]);
    // teto baixo em trechos: agache
    s = box(s, 32, 0, 6, H - 7, '%');
    s = box(s, 50, 0, 4, H - 6, '%');
    return s;
  })();
  const station = dots(flat(20, H, 3), [[3, H - 4, 'c'], [7, H - 4, 't'], [11, H - 8, '?'], [14, H - 4, 'a']]);
  const rail2 = (() => {
    let s = gap(50, H);
    s = hline(s, 0, H - 3, 50, '#');
    for (const x of [6, 7, 8, 16, 17, 26, 27, 28, 29, 38, 39]) s = put(s, x, H - 3, '.');
    s = dots(s, [[10, H - 7, 'p'], [20, H - 6, 'v'], [32, H - 7, '$'], [33, H - 7, '$'], [34, H - 7, '$'], [44, H - 6, 'v']]);
    s = box(s, 12, 0, 4, H - 7, '%');
    return s;
  })();
  const end = dots(flat(16, H, 3), [[4, H - 4, 't'], [11, H - 4, 'g']]);
  return cat(start, rail, station, rail2, end);
}

// 5-3 Cristais: gelo de sal e a chave atrás dos blocos.
function l53(): string[] {
  const start = dots(flat(16, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [12, H - 4, 'e']]);
  const ice = (() => {
    let s = flat(36, H, 3);
    s = hline(s, 0, H - 4, 36, 'I');
    s = box(s, 8, H - 7, 2, 3, 'I');
    s = box(s, 14, H - 8, 3, 4, 'I');
    s = box(s, 26, H - 7, 2, 3, 'I');
    s = dots(s, [[12, H - 5, 'u'], [22, H - 5, 'u'], [15, H - 9, 'p'], [30, H - 5, 't'], [33, H - 8, '?']]);
    return s;
  })();
  const g1 = put(gap(5, H), 1, H - 7, 'm');
  const vault = (() => {
    let s = flat(30, H, 3);
    s = box(s, 0, 0, 30, 2, '%');
    s = dots(s, [[3, H - 4, 'c']]);
    s = box(s, 8, H - 6, 6, 3, 'B');
    s = box(s, 10, H - 5, 2, 2, ' ');
    s = put(s, 10, H - 4, 'k');
    s = dots(s, [[18, H - 4, 't'], [23, H - 4, 'u'], [27, H - 8, 'l']]);
    s = box(s, 26, H - 6, 3, 1, '#');
    return s;
  })();
  const end = dots(cat(hill(H, 3, 2, 3), flat(16, H, 3)), [[9, H - 4, 't'], [12, H - 8, '?'], [13, H - 8, '7'], [11, H - 4, 'g']]);
  return cat(start, ice, g1, vault, end);
}

// 5-4 Forte de Sal: sal fervente e esteiras.
function l54(): string[] {
  let s = flat(100, H, 2, '%');
  s = box(s, 0, 0, 100, 2, '%');
  s = dots(s, [[3, H - 3, 's'], [7, H - 3, '@']]);
  for (let x = 10; x < 30; x++) s = vline(s, x, H - 2, 2, 'X');
  s = dots(s, [[12, H - 5, 'z'], [17, H - 6, 'z'], [22, H - 5, 'z'], [27, H - 7, 'z'], [19, H - 10, 'p']]);
  s = box(s, 30, H - 4, 3, 2, '%');
  s = hline(s, 34, H - 2, 12, '<');
  s = dots(s, [[38, H - 3, '°'], [43, H - 3, '°'], [48, H - 3, 'c']]);
  s = box(s, 52, H - 5, 2, 3, '%');
  s = put(s, 53, H - 6, '¬');
  for (let x = 56; x < 72; x++) s = vline(s, x, H - 2, 2, 'X');
  s = dots(s, [[58, H - 7, 'm'], [66, H - 9, 'm'], [62, H - 11, 'p']]);
  s = box(s, 72, H - 4, 3, 2, '%');
  s = dots(s, [[78, H - 3, 'w'], [82, H - 3, 't'], [88, H - 7, '?'], [89, H - 7, '+'], [94, H - 3, 'g']]);
  return s;
}

// 5-5 Farol das Minas: Velha Broca.
function l55(): string[][] {
  let a = flat(44, H, 3);
  a = box(a, 0, 0, 44, 2, '%');
  a = dots(a, [[3, H - 4, 's'], [8, H - 4, 'e'], [12, H - 4, 't'], [16, H - 8, '?'], [17, H - 8, '8'], [22, H - 4, 'c'], [26, H - 4, 't'], [32, H - 4, 'u'], [40, H - 4, '1']]);
  let b = flat(20, 12, 2, '%');
  b = box(b, 0, 0, 20, 1, '%');
  b = box(b, 0, 0, 1, 12, '%');
  b = box(b, 19, 0, 1, 12, '%');
  for (let y = 1; y < 12 - 3; y++) b = put(b, 3, y, ':');
  for (let y = 1; y < 12 - 3; y++) b = put(b, 15, y, ':');
  b = dots(b, [[2, 12 - 3, '1'], [15, 12 - 3, '*'], [9, 12 - 6, '='], [10, 12 - 6, '=']]);
  return [a, b];
}

export const ISLAND5: LevelDef[] = [
  {
    id: '5-1', name: 'GALERIA BRANCA', island: 5, theme: 'minas', music: 'minas', kind: 'normal', bolotaSkin: 'pedra',
    rooms: [{ map: l51() }],
    signs: ['BOLOTA PEDRA AFUNDA E ANDA NO FUNDO DA AGUA. TOUPEIRAS SURGEM EMBAIXO DE VOCE: FIQUE ATENTA!'],
    hint: 'A TOUPEIRA AVISA COM POEIRA ANTES DE SAIR.',
  },
  {
    id: '5-2', name: 'VAGONETES', island: 5, theme: 'minas', music: 'minas', kind: 'normal',
    rooms: [{ map: l52() }],
    signs: ['SUBA NO VAGONETE: ELE ANDA SOZINHO. PULE OS BURACOS E AGACHE NOS TETOS BAIXOS.'],
  },
  {
    id: '5-3', name: 'CRISTAIS', island: 5, theme: 'minas', music: 'minas', kind: 'normal', hasSecret: true, bolotaSkin: 'seda',
    rooms: [{ map: l53() }],
    signs: ['GELO DE SAL ESCORREGA. A CHAVE ESTA DENTRO DOS BLOCOS RACHADOS.'],
    hint: 'ROLE COM BOLOTA PARA ABRIR O COFRE DE BLOCOS.',
  },
  {
    id: '5-4', name: 'FORTE DE SAL', island: 5, theme: 'forte', music: 'forte', kind: 'forte',
    rooms: [{ map: l54() }],
  },
  {
    id: '5-5', name: 'FAROL DAS MINAS', island: 5, theme: 'minas', music: 'minas', kind: 'farol', boss: 'broca',
    rooms: [{ map: l55()[0] }, { map: l55()[1], theme: 'forte', music: 'chefe', lockY: 0 }],
    hint: 'A VELHA BROCA FICA TONTA QUANDO BATE NA PAREDE. PISE NELA ENTAO.',
  },
];

export { empty, stairsDown };
