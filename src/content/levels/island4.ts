/** Ilha 4 — Recife Profundo: água, maré, águas-vivas e peixes. */
import type { LevelDef } from '../../game/level/format';
import { cat, flat, empty, put, hill, gap, pool, hline, vline, box, dots } from './dsl';

const H = 14;

// 4-1 Maré Baixa: poças, depois uma sala com maré que sobe e desce.
function l41(): string[][] {
  const start = dots(flat(16, H, 3), [[3, H - 4, 's'], [8, H - 4, '@'], [12, H - 4, 'r']]);
  const pools = cat(
    put(flat(2, H, 3), 1, H - 4, '\\'),
    dots(pool(10, H, 1, 2), [[3, H - 3, 'ª'], [7, H - 3, 'ª'], [5, H - 6, 'p']]),
    put(flat(2, H, 3), 0, H - 4, '/'),
    dots(flat(8, H, 3), [[3, H - 4, 'u'], [5, H - 8, '?']]),
    put(flat(2, H, 3), 1, H - 4, '\\'),
    dots(pool(12, H, 1, 3), [[4, H - 3, 'j'], [8, H - 4, 'ª'], [5, H - 9, '='], [6, H - 9, '='], [6, H - 10, '$']]),
    put(flat(2, H, 3), 0, H - 4, '/'),
  );
  const toDoor = dots(flat(12, H, 3), [[3, H - 4, 'c'], [8, H - 4, '1']]);
  const roomA = cat(start, pools, toDoor);
  // sala de maré: plataformas altas só alcançáveis nadando com a maré alta
  let b = flat(50, H, 2);
  b = dots(b, [[2, H - 3, '1']]);
  b = box(b, 8, H - 6, 3, 1, '#');
  b = box(b, 14, H - 9, 3, 1, '#');
  b = box(b, 20, H - 11, 4, 1, '#');
  b = put(b, 21, H - 12, 'p');
  b = box(b, 28, H - 8, 3, 1, '#');
  b = box(b, 34, H - 6, 3, 1, '#');
  b = box(b, 42, H - 4, 8, 2, '#');
  b = dots(b, [[10, H - 3, 'u'], [18, H - 3, 'ª'], [26, H - 3, 'ª'], [31, H - 3, 'j'], [36, H - 3, 'r'], [40, H - 7, '?'], [46, H - 5, 'g'], [29, H - 9, 'p']]);
  return [roomA, b];
}

// 4-2 Corais: fase submersa com bolsões de ar.
function l42(): string[] {
  let s = flat(110, H, 2);
  s = box(s, 0, 0, 110, 1, '#');
  s = dots(s, [[3, H - 3, 's']]);
  // relevo do recife
  s = box(s, 10, H - 5, 3, 3, '#');
  s = box(s, 18, H - 7, 2, 5, '#');
  s = box(s, 26, H - 4, 4, 2, '#');
  s = box(s, 36, 1, 3, 6, '#');
  s = box(s, 44, H - 6, 5, 4, '#');
  s = box(s, 56, 1, 2, 8, '#');
  s = box(s, 64, H - 8, 3, 6, '#');
  s = box(s, 76, 1, 4, 5, '#');
  s = box(s, 84, H - 5, 6, 3, '#');
  s = box(s, 96, H - 9, 2, 7, '#');
  s = dots(s, [[8, H - 3, 'ª'], [15, 4, 'ª'], [22, H - 3, 'j'], [31, 6, 'j'], [40, H - 3, 'ª'], [50, 5, 'j'], [60, H - 3, 'ª'], [70, 4, 'j'], [81, H - 3, 'ª'], [92, 6, 'j'], [100, H - 3, 'ª']]);
  s = dots(s, [[19, H - 8, 'p'], [46, H - 7, 'c'], [65, H - 9, 'p'], [12, 3, '$'], [13, 3, '$'], [48, 3, '$'], [49, 3, '$'], [88, 3, '$'], [89, 3, '$'], [97, H - 10, '?'], [105, H - 3, 'g']]);
  // bolsões de ar: pequenas câmaras
  s = box(s, 30, 1, 4, 2, '"');
  s = box(s, 72, 1, 4, 2, '"');
  return s;
}

// 4-3 Caverna Submersa: chave no fundo, fechadura no alto.
function l43(): string[] {
  const beach = dots(flat(18, H, 3), [[3, H - 4, 's'], [8, H - 4, '@'], [13, H - 4, 'u']]);
  const cave = (() => {
    let s = flat(60, H, 2, '%');
    s = box(s, 0, 0, 60, 1, '%');
    s = box(s, 8, H - 5, 2, 3, '%');
    s = box(s, 16, 1, 2, 6, '%');
    s = box(s, 24, H - 7, 3, 5, '%');
    s = box(s, 34, 1, 3, 7, '%');
    s = box(s, 42, H - 6, 2, 4, '%');
    s = dots(s, [[12, H - 3, 'ª'], [20, 5, 'j'], [30, H - 3, 'j'], [38, 6, 'ª'], [46, 4, 'j'], [50, H - 3, 'ª']]);
    s = dots(s, [[25, H - 8, 'p'], [45, H - 3, 'k'], [52, H - 7, '?'], [55, H - 3, 'c'], [9, H - 6, 'p']]);
    // saída para a superfície: escada de blocos à direita
    s = box(s, 56, 1, 4, H - 3, '"');
    for (let y = 1; y < H - 2; y++) s = put(s, 57, y, '|');
    return s;
  })();
  const surface = (() => {
    let s = flat(30, H, 3);
    s = box(s, 4, H - 10, 6, 1, '#');
    s = dots(s, [[6, H - 11, 'l'], [10, H - 4, 'r'], [16, H - 8, '!'], [20, H - 4, 'j'], [25, H - 4, 'g']]);
    return s;
  })();
  return cat(beach, cave, surface);
}

// 4-4 Forte do Recife: água letal (neblina) e serras.
function l44(): string[] {
  let s = flat(96, H, 2, '%');
  s = box(s, 0, 0, 96, 2, '%');
  s = dots(s, [[3, H - 3, 's'], [7, H - 3, '@']]);
  for (let x = 10; x < 26; x++) s = vline(s, x, H - 2, 2, 'X');
  s = dots(s, [[12, H - 6, 'm'], [19, H - 8, 'm'], [16, H - 11, 'p']]);
  s = box(s, 26, H - 4, 4, 2, '%');
  s = dots(s, [[31, H - 3, '¬'], [36, H - 3, 'c'], [40, H - 3, '°'], [44, H - 3, '°'], [48, H - 3, 'w']]);
  s = hline(s, 38, H - 6, 12, '=');
  for (let x = 52; x < 70; x++) { s = put(s, x, H - 2, '~'); s = put(s, x, H - 3, 'W'); }
  s = dots(s, [[55, H - 3, 'j'], [61, H - 3, 'j'], [66, H - 3, 'ª'], [58, H - 7, 'q'], [64, H - 10, 'p']]);
  s = box(s, 70, H - 4, 3, 2, '%');
  s = dots(s, [[76, H - 3, 'w'], [80, H - 3, '¬'], [85, H - 7, '?'], [86, H - 7, '+'], [91, H - 3, 'g']]);
  return s;
}

// 4-5 Farol Afogado: Medusa-Maré numa arena com maré.
function l45(): string[][] {
  let a = flat(44, H, 3);
  a = dots(a, [[3, H - 4, 's'], [8, H - 4, 'u'], [14, H - 8, '?'], [15, H - 8, '+'], [20, H - 4, 'c'], [26, H - 4, 'r'], [32, H - 4, 'j'], [40, H - 4, '1']]);
  let b = flat(20, 14, 2, '%');
  b = box(b, 0, 0, 20, 1, '%');
  b = box(b, 0, 0, 1, 14, '%');
  b = box(b, 19, 0, 1, 14, '%');
  b = dots(b, [[2, 14 - 3, '1'], [12, 14 - 3, '*'], [4, 14 - 6, '='], [5, 14 - 6, '='], [14, 14 - 6, '='], [15, 14 - 6, '='], [9, 14 - 9, '='], [10, 14 - 9, '=']]);
  return [a, b];
}

export const ISLAND4: LevelDef[] = [
  {
    id: '4-1', name: 'MARE BAIXA', island: 4, theme: 'recife', music: 'recife', kind: 'normal',
    rooms: [{ map: l41()[0] }, { map: l41()[1], music: 'caverna', tide: { base: 9, amp: 3, period: 720 } }],
    signs: ['NA AGUA, Z DA BRACADAS. AGUAS-VIVAS ACESAS MACHUCAM: ESPERE APAGAREM.'],
    hint: 'A MARE SOBE E DESCE. ESPERE A AGUA SUBIR PARA ALCANCAR O ALTO.',
  },
  {
    id: '4-2', name: 'CORAIS', island: 4, theme: 'recife', music: 'caverna', kind: 'normal',
    rooms: [{ map: l42(), water: { y: 1 } }],
    hint: 'PEIXES-AGULHA SO NADAM EM LINHA RETA.',
  },
  {
    id: '4-3', name: 'CAVERNA SUBMERSA', island: 4, theme: 'recife', music: 'recife', kind: 'normal', hasSecret: true,
    rooms: [{ map: l43(), water: { y: 1, x0: 18, x1: 78 } }],
    signs: ['A CHAVE DO FUNDO ABRE A PORTA DE PEDRA LA EM CIMA. SEGURE X PARA CARREGAR.'],
    hint: 'A PORTA FICA NA SUPERFICIE. LEVE A CHAVE PELA ESCADA.',
  },
  {
    id: '4-4', name: 'FORTE DO RECIFE', island: 4, theme: 'forte', music: 'forte', kind: 'forte',
    rooms: [{ map: l44() }],
    signs: ['A NEBLINA MARE E MORTAL. NAO ENCOSTE.'],
  },
  {
    id: '4-5', name: 'FAROL AFOGADO', island: 4, theme: 'recife', music: 'recife', kind: 'farol', boss: 'medusa',
    rooms: [{ map: l45()[0] }, { map: l45()[1], theme: 'forte', music: 'chefe', lockY: 0, tide: { base: 11, amp: 3, period: 600 } }],
    hint: 'A MEDUSA SO PODE SER ATACADA APAGADA. NADE ATE ELA QUANDO A MARE SUBIR.',
  },
];

export { empty, hill, gap };
