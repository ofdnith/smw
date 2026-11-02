/** Ilha 2 — Bosque Encharcado: Bolota, lesmas, fantoches, redes e cordas. */
import type { LevelDef } from '../../game/level/format';
import { cat, flat, empty, put, hill, stairsUp, stairsDown, gap, pool, hline, vline, box, dots } from './dsl';

const H = 14;

// 2-1 Raízes Altas: Lumi conhece a Bolota.
function l21(): string[] {
  const start = dots(flat(18, H, 3), [[3, H - 4, 's'], [8, H - 4, '@'], [13, H - 4, 'e']]);
  const roots = (() => {
    let s = flat(30, H, 3);
    s = box(s, 4, H - 6, 3, 3, '#');
    s = box(s, 10, H - 8, 3, 5, '#');
    s = box(s, 17, H - 6, 4, 3, '#');
    s = box(s, 24, H - 5, 2, 2, 'B');
    s = dots(s, [[5, H - 7, 'n'], [11, H - 9, 'n'], [8, H - 4, 'r'], [14, H - 4, 'u'], [18, H - 7, 'p'], [21, H - 4, 'f'], [27, H - 4, 'r'], [12, H - 12, '$'], [13, H - 12, '$']]);
    return s;
  })();
  const g1 = put(put(gap(4, H), 0, H - 7, '=='), 2, H - 9, '==');
  const net = (() => {
    let s = flat(20, H, 3);
    s = box(s, 6, 1, 8, H - 4, '%');
    s = box(s, 6, 1, 8, 1, '%');
    s = vline(s, 4, 2, H - 6, 'V');
    s = vline(s, 5, 2, H - 6, 'V');
    s = hline(s, 0, 1, 6, '=');
    s = vline(s, 15, 2, H - 6, 'V');
    s = vline(s, 16, 2, H - 6, 'V');
    s = dots(s, [[2, 0, 'p'], [8, H - 4, 'n'], [11, H - 4, 'f'], [18, H - 4, 'c']]);
    return s;
  })();
  const slopes = dots(cat(hill(H, 3, 2, 4), put(flat(6, H, 3), 2, H - 4, 'n'), hill(H, 3, 3, 3)), [[4, H - 7, 'B'], [5, H - 7, '?'], [16, H - 8, '+']]);
  const pond = cat(put(flat(2, H, 3), 1, H - 4, '\\'), dots(pool(10, H, 1, 2), [[4, H - 3, 'ª'], [2, H - 8, '='], [3, H - 8, '='], [7, H - 8, '='], [8, H - 8, '=']]), put(flat(2, H, 3), 0, H - 4, '/'));
  const end = dots(flat(24, H, 3), [[3, H - 4, 'f'], [8, H - 8, '?'], [9, H - 8, '?'], [12, H - 4, 'n'], [16, H - 8, 'p'], [15, H - 7, '='], [16, H - 7, '='], [17, H - 7, '='], [20, H - 4, 'g']]);
  return cat(start, roots, g1, net, slopes, pond, end);
}

// 2-2 Teto de Musgo: caverna de rocha com lesmas no teto e cordas de balanço.
function l22(): string[] {
  const outside = dots(flat(14, H, 3), [[3, H - 4, 's'], [8, H - 4, '@'], [11, H - 4, 'e']]);
  const cave = (() => {
    let s = flat(60, H, 3, '%');
    s = box(s, 0, 0, 60, 2, '%');
    // estalactites
    for (const x of [6, 14, 22, 31, 40, 48, 55]) s = vline(s, x, 2, 2, '%');
    s = dots(s, [[8, 2, 'n'], [18, 2, 'n'], [34, 2, 'n'], [44, 2, 'n']]);
    s = box(s, 10, H - 5, 3, 2, 'B');
    s = box(s, 16, H - 6, 2, 3, '%');
    s = dots(s, [[20, H - 4, 'c'], [24, H - 9, '6'], [34, H - 9, '6']]);
    // fosso sob as cordas
    for (let x = 23; x < 40; x++) s = vline(s, x, H - 3, 3, '.');
    s = hline(s, 29, H - 2, 3, '=');
    s = put(s, 30, H - 3, 'p');
    s = box(s, 42, H - 6, 3, 3, 'B');
    s = dots(s, [[46, H - 4, 'f'], [50, H - 8, '?'], [51, H - 8, '7'], [52, H - 8, '?'], [56, H - 4, 'u']]);
    return s;
  })();
  const exit = dots(cat(stairsUp(H, 3, 3), flat(14, H, 6), stairsDown(H, 3, 3)), [[8, H - 7, 'n'], [11, H - 7, 'f'], [14, H - 11, 'p'], [13, H - 10, '='], [14, H - 10, '='], [15, H - 10, '=']]);
  const end = dots(flat(16, H, 3), [[4, H - 4, 'r'], [11, H - 4, 'g']]);
  return cat(outside, cave, exit, end);
}

// 2-3 Chuva Fina: plataformas que caem, saída secreta por uma rede escondida.
function l23(): string[] {
  const start = dots(flat(16, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [12, H - 4, 'e']]);
  const falls = (() => {
    let s = flat(30, H, 2);
    for (let x = 0; x < 30; x++) s = vline(s, x, H - 2, 2, 'X');
    s = box(s, 0, H - 4, 3, 2, '#');
    s = dots(s, [[5, H - 6, 'z'], [10, H - 7, 'z'], [15, H - 6, 'z'], [20, H - 8, 'z'], [25, H - 6, 'z'], [12, H - 10, '$'], [13, H - 10, '$'], [22, H - 11, 'p']]);
    s = box(s, 28, H - 4, 2, 2, '#');
    return s;
  })();
  const mid = (() => {
    let s = flat(26, H, 3);
    s = dots(s, [[2, H - 4, 'c'], [6, H - 4, 'n'], [10, H - 8, '?'], [11, H - 8, '!'], [14, H - 4, 'f'], [19, H - 4, 'u']]);
    // rede escondida que sobe até a porta dourada
    s = vline(s, 23, 1, H - 5, 'V');
    s = hline(s, 20, 1, 3, '=');
    s = put(s, 21, 1, '9');
    return s;
  })();
  const slopes = dots(cat(hill(H, 3, 3, 3), put(flat(8, H, 3), 3, H - 4, 'f'), hill(H, 3, 2, 5)), [[4, H - 7, 'n'], [15, H - 7, 'p'], [16, H - 9, '$'], [17, H - 9, '$']]);
  const end = dots(flat(20, H, 3), [[4, H - 4, 'r'], [8, H - 4, 'n'], [14, H - 4, 'g']]);
  return cat(start, falls, mid, slopes, end);
}

// 2-S Clareira: Bolota rolando através de blocos rachados.
function l2s(): string[] {
  let s = flat(70, H, 3);
  s = dots(s, [[3, H - 4, 's'], [7, H - 4, 'e'], [10, H - 4, '@']]);
  s = box(s, 14, H - 6, 2, 3, 'B');
  s = dots(s, [[18, H - 6, 'p']]);
  s = box(s, 22, H - 7, 2, 4, 'B');
  s = box(s, 28, H - 5, 6, 2, 'B');
  s = dots(s, [[30, H - 9, 'p'], [29, H - 8, '$'], [31, H - 8, '$']]);
  s = box(s, 38, H - 4, 1, 1, '#');
  s = box(s, 41, H - 5, 1, 2, '#');
  s = box(s, 44, H - 6, 1, 3, '#');
  s = box(s, 47, H - 7, 6, 4, '#');
  s = dots(s, [[49, H - 8, 'p'], [56, H - 4, 'r'], [60, H - 4, 'u'], [65, H - 4, 'g']]);
  return s;
}

// 2-4 Forte Alagado: água, serras e plataformas móveis.
function l24(): string[] {
  let s = flat(96, H, 2, '%');
  s = box(s, 0, 0, 96, 2, '%');
  s = dots(s, [[3, H - 3, 's'], [7, H - 3, '@']]);
  // fosso de água com plataformas
  for (let x = 12; x < 30; x++) { s = put(s, x, H - 2, '~'); s = put(s, x, H - 3, 'W'); }
  s = dots(s, [[14, H - 6, 'm'], [22, H - 6, 'm'], [18, H - 3, 'ª'], [26, H - 3, 'ª'], [20, H - 10, 'p']]);
  s = box(s, 30, H - 5, 4, 3, '%');
  s = put(s, 31, H - 6, '¬');
  s = dots(s, [[36, H - 3, 'c'], [40, H - 3, '°'], [44, H - 3, '°']]);
  s = hline(s, 39, H - 6, 8, '=');
  s = dots(s, [[47, H - 3, 'w']]);
  s = box(s, 50, H - 4, 2, 2, '%');
  s = box(s, 54, H - 6, 2, 4, '%');
  s = box(s, 58, H - 8, 2, 6, '%');
  s = dots(s, [[58, H - 9, 'p'], [62, H - 3, '¬']]);
  for (let x = 62; x < 76; x++) { s = put(s, x, H - 2, '~'); s = put(s, x, H - 3, 'W'); }
  s = dots(s, [[64, H - 7, 'q'], [70, H - 5, 'm'], [68, H - 3, 'ª'], [65, H - 12, 'p']]);
  s = box(s, 76, H - 4, 3, 2, '%');
  s = dots(s, [[82, H - 3, 'w'], [85, H - 7, '?'], [90, H - 3, 'g']]);
  return s;
}

// 2-5 Farol do Mangue: Mãe-Musgo.
function l25(): string[][] {
  let a = flat(44, H, 3);
  a = dots(a, [[3, H - 4, 's'], [8, H - 4, 'e'], [12, H - 4, 'n'], [16, H - 8, '?'], [17, H - 8, '8'], [22, H - 4, 'c'], [26, H - 4, 'f'], [32, H - 4, 'n'], [40, H - 4, '1']]);
  a = box(a, 28, H - 6, 2, 3, 'B');
  let b = flat(20, 12, 2, '%');
  b = box(b, 0, 0, 20, 1, '%');
  b = box(b, 0, 0, 1, 12, '%');
  b = box(b, 19, 0, 1, 12, '%');
  b = dots(b, [[2, 12 - 3, '1'], [14, 12 - 3, '*'], [5, 12 - 6, '='], [6, 12 - 6, '='], [13, 12 - 6, '='], [14, 12 - 6, '=']]);
  return [a, b];
}

export const ISLAND2: LevelDef[] = [
  {
    id: '2-1', name: 'RAIZES ALTAS', island: 2, theme: 'bosque', music: 'bosque', kind: 'normal',
    rooms: [{ map: l21() }],
    signs: ['ESTE E BOLOTA! PULE EM CIMA PARA MONTAR. SEGURE BAIXO + X PARA ROLAR. C DESMONTA.'],
    hint: 'LESMAS NO TETO MACHUCAM. NO CHAO, SAO SO LESMAS.',
  },
  {
    id: '2-2', name: 'TETO DE MUSGO', island: 2, theme: 'bosque', music: 'bosque', kind: 'normal',
    rooms: [{ map: l22() }],
    signs: ['PULE NA CORDA PARA BALANCAR. PULE DE NOVO NO PONTO MAIS ALTO!'],
  },
  {
    id: '2-3', name: 'CHUVA FINA', island: 2, theme: 'bosque', music: 'bosque', kind: 'normal', hasSecret: true,
    rooms: [{ map: l23() }],
    signs: ['PLATAFORMAS DE MADEIRA VELHA CAEM. NAO PARE!'],
    hint: 'HA UMA REDE QUE SOBE ATE ONDE NINGUEM OLHA.',
  },
  {
    id: '2-S', name: 'CLAREIRA', island: 2, theme: 'bosque', music: 'ceu', kind: 'normal',
    rooms: [{ map: l2s() }],
    signs: ['BOLOTA ROLANDO QUEBRA BLOCOS RACHADOS E SOBE DEGRAUS!'],
  },
  {
    id: '2-4', name: 'FORTE ALAGADO', island: 2, theme: 'forte', music: 'forte', kind: 'forte',
    rooms: [{ map: l24() }],
    signs: ['MARUJOS DE BRUMA BLOQUEIAM PELA FRENTE. PISE POR CIMA.'],
  },
  {
    id: '2-5', name: 'FAROL DO MANGUE', island: 2, theme: 'bosque', music: 'bosque', kind: 'farol', boss: 'maemusgo',
    rooms: [{ map: l25()[0] }, { map: l25()[1], theme: 'forte', music: 'chefe', lockY: 0 }],
    hint: 'QUANDO A MAE-MUSGO DESCE AO CHAO, A CAMBALHOTA A MACHUCA.',
  },
];

export { empty };
