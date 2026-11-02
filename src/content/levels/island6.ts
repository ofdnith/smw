/** Ilha 6 — Vale Sem Lua: escuridão, Lanterna Viva, morcegos e blocos invisíveis. */
import type { LevelDef } from '../../game/level/format';
import { cat, flat, empty, put, hill, stairsUp, gap, hline, vline, box, dots } from './dsl';

const H = 14;

// 6-1 Vaga-lumes: lâmpadas no caminho, a Lanterna Viva e morcegos.
function l61(): string[] {
  const start = dots(flat(16, H, 3), [[3, H - 4, 's'], [6, H - 6, ';'], [8, H - 4, '@'], [12, H - 8, '0']]);
  const woods = (() => {
    let s = flat(40, H, 3);
    s = box(s, 0, 0, 40, 1, '%');
    for (const x of [5, 13, 21, 29, 37]) s = put(s, x, H - 7, ';');
    s = dots(s, [[8, 1, 'b'], [16, 1, 'b'], [26, 1, 'b'], [34, 1, 'b']]);
    s = box(s, 10, H - 6, 2, 3, '#');
    s = box(s, 18, H - 8, 3, 5, '#');
    s = dots(s, [[19, H - 9, 'p'], [24, H - 4, 'f'], [31, H - 4, 'n'], [36, H - 4, 'c']]);
    return s;
  })();
  const g1 = put(put(gap(6, H), 1, H - 6, '=='), 4, H - 9, '==');
  const hidden = (() => {
    let s = flat(30, H, 3);
    s = dots(s, [[2, H - 7, ';'], [6, H - 4, 'f'], [12, H - 8, 'H'], [13, H - 8, 'H'], [14, H - 8, 'H'], [13, H - 11, 'p'], [18, H - 7, ';'], [22, H - 4, 'n'], [26, H - 8, '?']]);
    return s;
  })();
  const end = dots(cat(hill(H, 3, 2, 3), flat(14, H, 3)), [[4, H - 7, ';'], [8, H - 4, 'f'], [11, H - 4, 'g']]);
  return cat(start, woods, g1, hidden, end);
}

// 6-2 Breu: pontes invisíveis que só a lanterna revela.
function l62(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [10, H - 8, '0'], [5, H - 6, ';']]);
  const bridges = (() => {
    let s = gap(50, H);
    s = box(s, 0, H - 3, 4, 3, '#');
    for (let x = 6; x < 14; x++) s = put(s, x, H - 5, 'H');
    s = box(s, 16, H - 3, 3, 3, '#');
    s = put(s, 17, H - 7, ';');
    for (let x = 21; x < 27; x++) s = put(s, x, H - 7, 'H');
    s = put(s, 24, H - 9, 'p');
    s = box(s, 29, H - 3, 3, 3, '#');
    s = put(s, 30, H - 4, 'c');
    for (let x = 34; x < 44; x++) s = put(s, x, H - 6 + (x % 3 === 0 ? -1 : 0), 'H');
    s = box(s, 46, H - 3, 4, 3, '#');
    s = dots(s, [[10, 1, 'b'], [24, 1, 'b'], [38, 1, 'b']]);
    s = box(s, 0, 0, 50, 1, '%');
    return s;
  })();
  const vale = (() => {
    let s = flat(30, H, 3);
    s = dots(s, [[3, H - 7, ';'], [8, H - 4, 'f'], [12, H - 4, 'f'], [16, H - 8, '?'], [17, H - 8, '0'], [22, H - 4, 'n'], [26, H - 11, 'p'], [25, H - 10, '='], [26, H - 10, '='], [27, H - 10, '=']]);
    return s;
  })();
  const end = dots(flat(16, H, 3), [[4, H - 4, 'b'], [11, H - 4, 'g'], [8, H - 7, ';']]);
  return cat(start, bridges, vale, end);
}

// 6-3 Raízes Negras: porta dourada numa alcova escura.
function l63(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [11, H - 8, '0']]);
  const roots = (() => {
    let s = flat(44, H, 3);
    s = box(s, 0, 0, 44, 1, '%');
    s = box(s, 6, H - 6, 2, 3, '#');
    s = box(s, 12, H - 8, 2, 5, '#');
    s = box(s, 20, H - 6, 3, 3, '#');
    s = box(s, 28, H - 9, 2, 6, '#');
    s = dots(s, [[7, H - 7, 'n'], [13, H - 9, 'p'], [21, H - 7, 'p'], [16, 1, 'b'], [24, 1, 'b'], [34, 1, 'b'], [17, H - 4, 'f'], [25, H - 4, 'f'], [33, H - 4, 'n'], [38, H - 4, 'c'], [9, H - 7, ';'], [31, H - 7, ';']]);
    // alcova secreta no teto: blocos invisíveis sobem até ela
    s = box(s, 36, 1, 6, 4, '.');
    s = put(s, 40, 4, '9');
    s = dots(s, [[33, H - 6, 'H'], [35, H - 8, 'H'], [37, H - 10, 'H'], [39, 6, 'H']]);
    return s;
  })();
  const end = dots(cat(stairsUp(H, 3, 3), flat(16, H, 6)), [[8, H - 7, 'b'], [12, H - 10, '?'], [14, H - 7, 'g']]);
  return cat(start, roots, end);
}

// 6-4 Forte Sombrio: escuro, com lâmpadas e chamas.
function l64(): string[] {
  let s = flat(96, H, 2, '%');
  s = box(s, 0, 0, 96, 2, '%');
  s = dots(s, [[3, H - 3, 's'], [7, H - 3, '@'], [5, H - 6, ';']]);
  s = dots(s, [[12, H - 3, '°'], [16, H - 3, '°'], [20, H - 3, '°'], [14, H - 7, ';'], [22, H - 6, ';']]);
  s = hline(s, 11, H - 5, 12, '=');
  s = box(s, 26, H - 5, 2, 3, '%');
  s = put(s, 27, H - 6, '¬');
  s = dots(s, [[32, H - 3, 'c'], [30, H - 7, ';']]);
  for (let x = 36; x < 54; x++) s = vline(s, x, H - 2, 2, 'X');
  s = dots(s, [[38, H - 6, 'm'], [46, H - 8, 'm'], [42, H - 11, 'p'], [44, H - 7, ';']]);
  s = box(s, 54, H - 4, 3, 2, '%');
  s = dots(s, [[60, H - 3, 'w'], [64, H - 3, 'f'], [62, H - 7, ';'], [70, H - 3, '¬'], [74, H - 3, 'w'], [78, H - 7, ';'], [84, H - 7, '?'], [85, H - 7, '0'], [90, H - 3, 'g']]);
  return s;
}

// 6-5 Farol Apagado: Sombra de Lumi.
function l65(): string[][] {
  let a = flat(40, H, 3);
  a = dots(a, [[3, H - 4, 's'], [5, H - 7, ';'], [8, H - 8, '0'], [12, H - 4, 'f'], [16, H - 7, ';'], [20, H - 4, 'c'], [26, H - 4, 'b'], [30, H - 7, ';'], [36, H - 4, '1']]);
  a = box(a, 0, 0, 40, 1, '%');
  let b = flat(20, 12, 2, '%');
  b = box(b, 0, 0, 20, 1, '%');
  b = box(b, 0, 0, 1, 12, '%');
  b = box(b, 19, 0, 1, 12, '%');
  b = dots(b, [[2, 12 - 3, '1'], [15, 12 - 3, '*'], [5, 12 - 6, '='], [6, 12 - 6, '='], [13, 12 - 6, '='], [14, 12 - 6, '='], [9, 12 - 8, ';']]);
  return [a, b];
}

export const ISLAND6: LevelDef[] = [
  {
    id: '6-1', name: 'VAGA-LUMES', island: 6, theme: 'vale', music: 'vale', kind: 'normal',
    rooms: [{ map: l61(), dark: true }],
    signs: ['A LANTERNA VIVA: X ATIRA ORBES DE LUZ. ELES REVELAM BLOCOS INVISIVEIS E DISSOLVEM FANTOCHES.'],
    hint: 'MORCEGOS-FOLE INFLAM E ESTOURAM. ATIRE ANTES.',
  },
  {
    id: '6-2', name: 'BREU', island: 6, theme: 'vale', music: 'vale', kind: 'normal',
    rooms: [{ map: l62(), dark: true }],
    signs: ['HA PONTES QUE NINGUEM VE. A LUZ MOSTRA O CAMINHO.'],
  },
  {
    id: '6-3', name: 'RAIZES NEGRAS', island: 6, theme: 'vale', music: 'vale', kind: 'normal', hasSecret: true,
    rooms: [{ map: l63(), dark: true }],
    signs: ['PERTO DO SINO, UMA ESCADA INVISIVEL SOBE ATE UMA PORTA.'],
    hint: 'ATIRE ORBES PARA O ALTO PERTO DO SINO.',
  },
  {
    id: '6-4', name: 'FORTE SOMBRIO', island: 6, theme: 'forte', music: 'forte', kind: 'forte',
    rooms: [{ map: l64(), dark: true }],
  },
  {
    id: '6-5', name: 'FAROL APAGADO', island: 6, theme: 'vale', music: 'vale', kind: 'farol', boss: 'sombra',
    rooms: [{ map: l65()[0], dark: true }, { map: l65()[1], theme: 'forte', music: 'chefe', lockY: 0, dark: true }],
    hint: 'A SOMBRA REPETE O QUE VOCE FEZ UM SEGUNDO ATRAS. PULE... E ESPERE.',
  },
];

export { empty };
