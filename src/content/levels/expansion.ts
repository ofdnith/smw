/**
 * Expansão: fases que completam o plano (5–6 fases normais por ilha e 8 desafios).
 * Ids novos não colidem com os antigos (saves continuam válidos); `label` é o número exibido no mapa.
 */
import type { LevelDef } from '../../game/level/format';
import { cat, flat, put, hill, stairsUp, stairsDown, gap, pool, hline, vline, box, dots } from './dsl';

const H = 14;
const HT = 22;

// ======================================================================= Ilha 1

// 1-6 Molhe dos Pescadores: ponte sobre o mar, barcos que vão e vêm, gaivotas.
function l16(): string[] {
  const start = dots(flat(16, H, 4), [[3, H - 5, 's'], [8, H - 5, '@'], [12, H - 5, 'r']]);
  const pier = (() => {
    let s = pool(40, H, 1, 3);
    s = hline(s, 0, H - 4, 40, '_');
    for (const x of [9, 10, 11, 22, 23, 24, 25]) s = put(s, x, H - 4, 'W');
    s = dots(s, [[10, H - 7, 'z'], [23, H - 7, 'z'], [16, H - 5, 'r'], [30, H - 5, 'u'], [5, H - 9, 'v'], [20, H - 10, 'v'], [34, H - 9, 'v']]);
    s = dots(s, [[10, H - 9, '$'], [11, H - 9, '$'], [24, H - 9, 'p'], [17, H - 3, 'ª'], [33, H - 3, 'ª']]);
    return s;
  })();
  const dock = dots(flat(24, H, 4), [[2, H - 5, 'c'], [6, H - 9, '?'], [7, H - 9, '8'], [8, H - 9, '?'], [12, H - 5, 'r'], [20, H - 5, 'ç'], [15, H - 9, '$'], [16, H - 9, '$']]);
  const boats = (() => {
    let s = pool(34, H, 1, 3);
    s = box(s, 0, H - 4, 2, 1, '#');
    s = dots(s, [[4, H - 5, 'm'], [16, H - 6, 'm'], [27, H - 5, 'm'], [6, H - 3, 'ª'], [20, H - 3, 'ª'], [16, H - 9, 'p']]);
    s = dots(s, [[10, H - 9, '$'], [11, H - 9, '$'], [22, H - 9, '$'], [23, H - 9, '$']]);
    s = box(s, 32, H - 4, 2, 1, '#');
    return s;
  })();
  const dunes = dots(cat(hill(H, 3, 3, 4), flat(6, H, 3)), [[5, H - 7, 'r'], [12, H - 4, 'u'], [5, H - 11, 'p']]);
  const end = dots(cat(stairsUp(H, 3, 3), flat(18, H, 5)), [[8, H - 6, 'r'], [11, H - 10, '?'], [15, H - 6, 'g']]);
  return cat(start, pier, dock, boats, dunes, end);
}

// ======================================================================= Ilha 2

// 2-6 Cogumelos Saltitantes: molas sobre o pântano, lesmas e fantoches.
function l26(): string[] {
  const start = dots(flat(16, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [11, H - 4, 'e']]);
  const bounce = (() => {
    let s = flat(36, H, 2);
    for (let x = 0; x < 36; x++) s = vline(s, x, H - 2, 2, 'X');
    s = box(s, 0, H - 4, 4, 2, '#');
    s = box(s, 7, H - 4, 3, 2, '#');
    s = put(s, 8, H - 5, 'y');
    s = box(s, 10, H - 10, 5, 1, '#');
    s = hline(s, 18, H - 8, 3, '=');
    s = hline(s, 24, H - 7, 3, '=');
    s = box(s, 30, H - 4, 6, 2, '#');
    s = dots(s, [[12, H - 13, 'p'], [11, H - 11, '$'], [13, H - 11, '$'], [19, H - 9, '$'], [25, H - 8, '$'], [32, H - 5, 'n']]);
    return s;
  })();
  const forest = (() => {
    let s = flat(32, H, 3);
    s = dots(s, [[3, H - 4, 'c'], [7, H - 4, 'n'], [10, H - 8, '?'], [11, H - 8, '!'], [12, H - 8, '?'], [16, H - 4, 'f']]);
    s = box(s, 19, H - 5, 2, 2, 'B');
    s = box(s, 22, H - 8, 4, 1, '#');
    s = dots(s, [[24, H - 4, 'n'], [28, H - 4, 'f'], [23, H - 11, 'p']]);
    return s;
  })();
  const canopy = (() => {
    let s = flat(30, H, 3);
    s = vline(s, 3, 3, H - 6, '|');
    s = hline(s, 4, 3, 8, '=');
    s = hline(s, 14, 5, 6, '=');
    s = hline(s, 22, 4, 5, '=');
    s = dots(s, [[8, 2, 'n'], [16, 4, '$'], [17, 4, '$'], [24, 3, '$'], [8, H - 4, 'u'], [16, H - 4, 'n'], [24, H - 4, 'r']]);
    return s;
  })();
  const end = dots(cat(hill(H, 3, 2, 4), flat(16, H, 3)), [[4, H - 7, 'n'], [10, H - 4, 'y'], [10, H - 11, 'p'], [16, H - 4, 'g']]);
  return cat(start, bounce, forest, canopy, end);
}

// 2-7 Tronco Oco: subida por dentro de uma árvore; segredo sob o assoalho de blocos rachados.
function l27(): string[] {
  const start = dots(flat(14, HT, 3), [[3, HT - 4, 's'], [7, HT - 4, '@'], [11, HT - 4, 'n']]);
  const trunk = (() => {
    let s = flat(30, HT, 3, '%');
    s = box(s, 0, 0, 30, 2, '%');
    s = box(s, 0, 2, 1, 14, '%');
    s = box(s, 29, 6, 1, 13, '%');
    // interior: plataformas e cordas
    s = hline(s, 3, 15, 5, '=');
    s = vline(s, 10, 10, 8, '|');
    s = hline(s, 11, 11, 13, '=');
    // assoalho de cima: pedra e blocos rachados; a câmara secreta fica embaixo dos rachados
    s = hline(s, 1, 5, 13, '%');
    s = hline(s, 14, 5, 10, 'B');
    s = hline(s, 24, 5, 6, '=');
    s = vline(s, 25, 4, 14, '|');
    s = box(s, 13, 6, 1, 2, '%');
    s = box(s, 24, 6, 1, 2, '%');
    s = hline(s, 13, 8, 12, '%');
    s = put(s, 18, 7, '9');
    s = dots(s, [[14, 10, 'n'], [21, 10, 'f'], [5, 14, '$'], [6, 14, '$'], [3, 3, 'p'], [6, HT - 4, 'n'], [18, HT - 4, 'u'], [23, HT - 4, 'c']]);
    return s;
  })();
  const sky = (() => {
    let s = gap(26, HT);
    s = hline(s, 0, 5, 22, '=');
    s = box(s, 0, HT - 3, 26, 3, '#');
    s = dots(s, [[5, 4, 'v'], [12, 4, 'n'], [18, 4, 'v'], [10, 1, 'p'], [8, HT - 4, 'r'], [16, HT - 4, 'n']]);
    return s;
  })();
  const end = dots(flat(18, HT, 3), [[4, HT - 4, 'f'], [8, HT - 8, '7'], [12, HT - 4, 'g']]);
  return cat(start, trunk, sky, end);
}

// ======================================================================= Ilha 3

// 3-6 Ponte de Corda: pontes finas entre falésias, pipas e gaivotas.
function l36(): string[] {
  const start = dots(flat(14, H, 4), [[3, H - 5, 's'], [7, H - 5, '@'], [11, H - 9, '+']]);
  const span = (w: number, extra: [number, number, string][]): string[] => {
    let s = gap(w, H);
    s = hline(s, 0, H - 4, w, '_');
    return dots(s, extra);
  };
  const cliff = (w: number, extra: [number, number, string][]): string[] => dots(flat(w, H, 4), extra);
  return cat(
    start,
    span(18, [[6, H - 9, 'i'], [12, H - 5, 'r'], [9, H - 9, '$'], [10, H - 9, '$']]),
    cliff(10, [[3, H - 5, 'u'], [6, H - 9, '?'], [7, H - 9, '!']]),
    span(14, [[4, H - 8, 'v'], [10, H - 10, 'i'], [7, H - 9, 'p']]),
    cliff(12, [[3, H - 5, 'c'], [8, H - 5, 'r']]),
    (() => {
      // ponte quebrada: plataformas que caem
      let s = gap(24, H);
      s = hline(s, 0, H - 4, 4, '_');
      s = dots(s, [[6, H - 7, 'z'], [11, H - 8, 'z'], [16, H - 7, 'z']]);
      s = hline(s, 20, H - 4, 4, '_');
      return dots(s, [[11, H - 10, 'p'], [8, H - 11, 'v'], [14, H - 11, 'v']]);
    })(),
    cliff(12, [[3, H - 5, 'u'], [8, H - 9, '$'], [9, H - 9, '$']]),
    span(16, [[5, H - 9, 'i'], [11, H - 5, 'r'], [8, H - 9, 'p']]),
    dots(cat(stairsUp(H, 4, 3), flat(16, H, 6)), [[8, H - 7, 'u'], [12, H - 7, 'g']]),
  );
}

// 3-7 Escarpa: subida vertical por cordas, redes e correntes de vento.
function l37(): string[] {
  const HH = 34;
  let s = flat(44, HH, 2, '#');
  s = box(s, 0, 0, 1, HH, '#');
  s = box(s, 43, 0, 1, HH, '#');
  s = dots(s, [[3, HH - 3, 's'], [7, HH - 3, '@']]);
  // andar 1: cordas
  s = vline(s, 12, HH - 9, 7, '|');
  s = hline(s, 13, HH - 9, 8, '=');
  s = dots(s, [[17, HH - 10, 'u'], [16, HH - 3, 'r'], [24, HH - 3, 'r']]);
  s = box(s, 24, HH - 12, 8, 1, '#');
  s = dots(s, [[28, HH - 13, 'c']]);
  // andar 2: vento
  for (let x = 34; x < 37; x++) s = vline(s, x, HH - 22, 18, '&');
  s = hline(s, 30, HH - 23, 6, '=');
  s = hline(s, 20, HH - 20, 7, '=');
  s = dots(s, [[23, HH - 21, 'i'], [22, HH - 24, 'p'], [32, HH - 24, '$'], [33, HH - 24, '$']]);
  // andar 3: redes
  s = vline(s, 14, 6, HH - 25, 'V');
  s = vline(s, 15, 6, HH - 25, 'V');
  s = hline(s, 3, HH - 25, 10, '=');
  s = dots(s, [[6, HH - 26, 'v'], [4, HH - 29, 'p']]);
  s = hline(s, 16, 6, 10, '=');
  s = dots(s, [[20, 5, 'u'], [24, 3, '?']]);
  // topo
  s = box(s, 28, 6, 15, 1, '#');
  s = vline(s, 27, 6, 6, '|');
  s = dots(s, [[32, 5, 'v'], [36, 1, 'p'], [39, 5, 'g']]);
  return s;
}

// 3-8 Vendaval: o vento sopra contra; a Folha ajuda a vencer os fossos.
function l38(): string[] {
  const start = dots(flat(16, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [11, H - 8, '+']]);
  const field = (() => {
    let s = flat(30, H, 3);
    s = dots(s, [[5, H - 4, 'r'], [10, H - 9, 'i'], [15, H - 4, 'u'], [22, H - 10, 'i'], [26, H - 4, 'r']]);
    s = hline(s, 12, H - 7, 4, '=');
    return dots(s, [[13, H - 8, 'p'], [14, H - 8, '$']]);
  })();
  const pits = (() => {
    let s = gap(30, H);
    s = box(s, 4, H - 4, 3, 4, '#');
    s = box(s, 10, H - 5, 3, 5, '#');
    s = box(s, 16, H - 4, 3, 4, '#');
    s = box(s, 22, H - 6, 3, 6, '#');
    s = dots(s, [[11, H - 6, 'u'], [13, H - 10, 'i'], [23, H - 7, 'c'], [8, H - 9, 'v'], [17, H - 9, 'p']]);
    return s;
  })();
  const ridge = dots(cat(flat(4, H, 6), stairsDown(H, 3, 4, 2), flat(16, H, 3)), [[7, H - 8, 'i'], [14, H - 4, 'r'], [18, H - 8, '?'], [19, H - 8, '!'], [22, H - 4, 'u'], [17, H - 8, 'p']]);
  const end = dots(cat(hill(H, 3, 2, 4), flat(14, H, 3)), [[4, H - 7, 'r'], [16, H - 4, 'g']]);
  return cat(start, field, pits, ridge, end);
}

// ======================================================================= Ilha 4

// 4-6 Praia de Conchas: poças com peixes, ouriços e uma mola até as pérolas.
function l46(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [11, H - 4, 'r']]);
  const p = (w: number, depth: number, extra: [number, number, string][]): string[] => cat(
    put(flat(2, H, 3), 1, H - 4, '\\'),
    dots(pool(w, H, 1, depth), extra),
    put(flat(2, H, 3), 0, H - 4, '/'),
  );
  const shore = dots(flat(14, H, 3), [[3, H - 4, 'u'], [7, H - 8, '?'], [8, H - 8, '8'], [11, H - 4, 'r']]);
  const shore2 = dots(flat(16, H, 3), [[2, H - 4, 'c'], [6, H - 4, 'y'], [6, H - 11, 'p'], [11, H - 4, 'u']]);
  const rocks = (() => {
    let s = flat(24, H, 3);
    s = box(s, 4, H - 5, 3, 2, '#');
    s = box(s, 10, H - 7, 3, 4, '#');
    s = box(s, 16, H - 5, 3, 2, '#');
    return dots(s, [[11, H - 8, 'r'], [8, H - 4, 'u'], [14, H - 4, 'u'], [20, H - 4, 'r'], [11, H - 12, '$'], [12, H - 12, '$']]);
  })();
  const end = dots(flat(18, H, 3), [[4, H - 4, 'r'], [8, H - 8, '?'], [13, H - 4, 'g']]);
  return cat(
    start,
    p(10, 2, [[3, H - 3, 'ª'], [7, H - 3, 'ª'], [5, H - 7, 'p']]),
    shore,
    p(14, 3, [[4, H - 3, 'j'], [10, H - 4, 'ª'], [6, H - 7, '='], [7, H - 7, '='], [7, H - 8, '$']]),
    shore2,
    rocks,
    p(12, 3, [[3, H - 3, 'ª'], [8, H - 3, 'j'], [6, H - 8, 'p']]),
    end,
  );
}

// 4-7 Abismo Azul: fundo do mar escuro; a porta dourada fica sob um assoalho de blocos rachados.
function l47(): string[] {
  let s = flat(120, H, 2, '%');
  s = box(s, 0, 0, 120, 1, '%');
  s = dots(s, [[3, H - 3, 's'], [6, H - 3, '@'], [8, H - 7, '0']]);
  s = box(s, 6, H - 8, 4, 1, '%');
  const rocks: [number, number, number, number][] = [[14, H - 5, 3, 3], [22, 1, 2, 6], [30, H - 7, 4, 5], [40, 1, 3, 5], [48, H - 6, 3, 4], [58, 1, 2, 7], [66, H - 5, 5, 3], [76, 1, 3, 6], [86, H - 8, 3, 6], [96, 1, 2, 6]];
  for (const [x, y, w, h] of rocks) s = box(s, x, y, w, h, '%');
  s = dots(s, [[10, H - 3, 'ª'], [18, 4, 'j'], [27, H - 3, 'j'], [36, 6, 'ª'], [45, H - 3, 'j'], [53, 5, 'ª'], [62, H - 3, 'j'], [72, 4, 'j'], [82, H - 3, 'ª'], [92, 6, 'j'], [104, H - 3, 'ª']]);
  s = dots(s, [[31, H - 8, 'p'], [49, H - 7, 'c'], [87, H - 9, 'p'], [24, 8, '$'], [25, 8, '$'], [60, 9, '$'], [61, 9, '$'], [68, H - 9, '?'], [69, H - 9, '!']]);
  // assoalho rachado sobre a câmara secreta
  s = box(s, 106, H - 6, 8, 1, 'B');
  s = box(s, 106, H - 5, 8, 3, '"');
  s = box(s, 105, H - 6, 1, 4, '%');
  s = box(s, 114, H - 6, 1, 4, '%');
  s = put(s, 109, H - 3, '9');
  s = dots(s, [[110, H - 8, 'p']]);
  // bolsões de ar
  s = box(s, 35, 1, 4, 2, '"');
  s = box(s, 80, 1, 4, 2, '"');
  s = box(s, 115, H - 4, 5, 2, '%');
  s = put(s, 117, H - 5, 'g');
  return s;
}

// 4-8 Maré Alta: duas salas de maré; a água leva até os blocos do alto.
function l48(): string[][] {
  const a = (() => {
    let s = flat(60, H, 2);
    s = dots(s, [[3, H - 3, 's'], [7, H - 3, '@']]);
    s = box(s, 10, H - 5, 3, 1, '#');
    s = box(s, 16, H - 8, 3, 1, '#');
    s = box(s, 22, H - 10, 3, 1, '#');
    s = put(s, 23, H - 11, 'p');
    s = box(s, 28, H - 7, 4, 1, '#');
    s = box(s, 36, H - 9, 3, 1, '#');
    s = box(s, 42, H - 6, 3, 1, '#');
    s = box(s, 50, H - 4, 10, 2, '#');
    s = dots(s, [[12, H - 3, 'ª'], [20, H - 3, 'j'], [30, H - 3, 'ª'], [38, H - 3, 'j'], [46, H - 3, 'u'], [37, H - 10, '$'], [38, H - 10, '$'], [29, H - 8, 'c'], [55, H - 5, '1'], [43, H - 10, 'p']]);
    return s;
  })();
  const b = (() => {
    let s = flat(50, H, 2);
    s = dots(s, [[2, H - 3, '1']]);
    s = box(s, 8, H - 6, 4, 1, '#');
    s = box(s, 15, H - 9, 2, 1, '#');
    s = box(s, 20, H - 11, 4, 1, '#');
    s = put(s, 21, H - 12, 'p');
    s = box(s, 28, H - 8, 2, 1, '#');
    s = box(s, 34, H - 6, 3, 1, '#');
    s = box(s, 42, H - 4, 8, 2, '#');
    s = dots(s, [[10, H - 3, 'r'], [18, H - 3, 'j'], [26, H - 3, 'ª'], [32, H - 3, 'j'], [38, H - 3, 'u'], [46, H - 5, 'g']]);
    return s;
  })();
  return [a, b];
}

// ======================================================================= Ilha 5

// 5-6 Esteiras de Sal: esteiras, gelo e toupeiras.
function l56(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@']]);
  const belts = (() => {
    let s = flat(40, H, 3);
    s = hline(s, 0, H - 3, 12, '>');
    s = hline(s, 16, H - 3, 10, '<');
    s = box(s, 12, H - 5, 4, 2, '%');
    s = hline(s, 28, H - 3, 12, '>');
    s = dots(s, [[6, H - 4, 't'], [14, H - 6, 'p'], [20, H - 4, 'u'], [22, H - 8, '?'], [23, H - 8, '!'], [32, H - 4, 't'], [36, H - 8, '$'], [37, H - 8, '$']]);
    return s;
  })();
  const ice = (() => {
    let s = flat(30, H, 3);
    s = hline(s, 0, H - 4, 30, 'I');
    s = dots(s, [[2, H - 5, 'c']]);
    s = box(s, 8, H - 6, 2, 2, 'I');
    s = box(s, 18, H - 7, 3, 3, 'I');
    s = dots(s, [[12, H - 5, 't'], [24, H - 5, 'u'], [19, H - 11, 'p'], [26, H - 9, '$']]);
    return s;
  })();
  const crumble = (() => {
    let s = gap(26, H);
    s = box(s, 0, H - 3, 3, 3, '%');
    s = hline(s, 5, H - 5, 4, 'F');
    s = hline(s, 11, H - 7, 4, 'F');
    s = hline(s, 17, H - 5, 4, 'F');
    s = box(s, 23, H - 3, 3, 3, '%');
    return dots(s, [[12, H - 11, 'p'], [8, H - 9, 'v']]);
  })();
  const end = dots(flat(18, H, 3), [[3, H - 4, 't'], [8, H - 8, '?'], [13, H - 4, 'g']]);
  return cat(start, belts, ice, crumble, end);
}

// 5-7 Poço de Sal: descida por camadas de blocos rachados; um túnel lateral guarda a porta dourada.
function l57(): string[] {
  const HH = 36;
  let s = flat(40, HH, 2, '%');
  s = box(s, 0, 0, 40, 1, '%');
  s = box(s, 0, 0, 1, HH, '%');
  s = box(s, 39, 0, 1, HH, '%');
  // topo: plataforma de partida
  s = box(s, 1, 5, 14, 1, '%');
  s = dots(s, [[3, 4, 's'], [7, 4, '@'], [11, 4, 't']]);
  // camada 1: blocos rachados para cavar com a cambalhota
  s = box(s, 15, 8, 10, 1, 'B');
  s = box(s, 1, 8, 14, 1, '%');
  s = box(s, 25, 8, 14, 1, '%');
  s = dots(s, [[20, 5, '$'], [21, 5, '$'], [30, 7, 'u'], [33, 4, 'p'], [32, 5, '='], [33, 5, '='], [34, 5, '=']]);
  // camada 2
  s = box(s, 1, 15, 24, 1, '%');
  s = box(s, 25, 15, 8, 1, 'B');
  s = box(s, 33, 15, 6, 1, '%');
  s = dots(s, [[6, 14, 't'], [12, 14, 'u'], [18, 14, 'c'], [5, 11, 'p'], [4, 12, '='], [5, 12, '='], [6, 12, '=']]);
  // camada 3, com um vão para o fundo; à esquerda, uma corda desce até um túnel esquecido
  s = box(s, 1, 22, 26, 1, '%');
  s = box(s, 31, 22, 8, 1, '=');
  s = box(s, 3, 26, 10, 1, '%');
  s = box(s, 12, 23, 1, 3, '%');
  s = vline(s, 2, 12, 14, '|');
  s = put(s, 7, 25, '9');
  s = dots(s, [[14, 21, 't'], [22, 21, 'u'], [24, 21, '$'], [25, 21, '$']]);
  // fundo: saída
  s = dots(s, [[16, HH - 3, 't'], [22, HH - 3, 'u'], [28, HH - 3, 't'], [20, HH - 7, '?'], [21, HH - 7, '7'], [34, HH - 3, 'g']]);
  return s;
}

// 5-8 Trilho Duplo: dois vagonetes, buracos e tetos baixos.
function l58(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [11, H - 4, 'a']]);
  const rail = (w: number, holes: number[], ceil: [number, number][], extra: [number, number, string][]): string[] => {
    let s = gap(w, H);
    s = hline(s, 0, H - 3, w, '#');
    for (const x of holes) s = put(s, x, H - 3, '.');
    for (const [x, cw] of ceil) s = box(s, x, 0, cw, H - 7, '%');
    return dots(s, extra);
  };
  const r1 = rail(56, [7, 8, 16, 17, 18, 27, 28, 38, 39, 40, 41, 50, 51], [[20, 5], [44, 4]], [[12, H - 7, '$'], [13, H - 7, '$'], [24, H - 8, 'p'], [33, H - 6, 'v'], [46, H - 8, 'p'], [55, H - 6, 'v']]);
  const mid = dots(flat(20, H, 3), [[3, H - 4, 'c'], [7, H - 4, 't'], [10, H - 8, '?'], [11, H - 8, '!'], [16, H - 4, 'a']]);
  const r2 = rail(60, [5, 6, 7, 15, 16, 24, 25, 26, 27, 36, 37, 46, 47, 48], [[10, 4], [30, 5], [50, 4]], [[20, H - 7, 'p'], [32, H - 6, 'v'], [40, H - 7, '$'], [41, H - 7, '$'], [42, H - 7, '$'], [55, H - 6, 'v']]);
  const end = dots(flat(16, H, 3), [[4, H - 4, 't'], [11, H - 4, 'g']]);
  return cat(start, r1, mid, r2, end);
}

// ======================================================================= Ilha 6

// 6-6 Pântano de Névoa: poças letais, fantoches e plataformas que caem no escuro.
function l66(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [10, H - 8, '0'], [5, H - 7, ';']]);
  const bog = (w: number, plats: [number, number, string][], extra: [number, number, string][]): string[] => {
    let s = flat(w, H, 2);
    for (let x = 0; x < w; x++) s = vline(s, x, H - 2, 2, 'X');
    s = box(s, 0, H - 4, 2, 2, '#');
    s = box(s, w - 2, H - 4, 2, 2, '#');
    for (const [x, y, c] of plats) s = c === 'z' ? put(s, x, y, 'z') : hline(s, x, y, 3, c);
    return dots(s, extra);
  };
  const b1 = bog(24, [[4, H - 5, '='], [10, H - 6, 'z'], [15, H - 5, '='], [19, H - 6, 'z']], [[11, H - 9, 'p'], [16, H - 6, 'f'], [7, H - 9, ';'], [17, H - 9, ';']]);
  const land = dots(flat(20, H, 3), [[3, H - 4, 'f'], [7, H - 4, 'c'], [10, H - 8, '?'], [11, H - 8, '0'], [15, H - 4, 'n'], [5, H - 7, ';'], [17, H - 7, ';']]);
  const b2 = bog(30, [[4, H - 6, 'z'], [9, H - 7, '='], [14, H - 6, 'z'], [19, H - 8, '='], [25, H - 6, 'z']], [[20, H - 12, 'p'], [10, H - 8, 'f'], [12, 1, 'b'], [22, 1, 'b'], [9, H - 10, ';'], [21, H - 11, ';']]);
  const end = dots(flat(18, H, 3), [[4, H - 4, 'f'], [8, H - 4, 'n'], [12, H - 4, 'g'], [6, H - 7, ';'], [14, H - 7, ';'], [9, H - 12, 'p'], [6, H - 6, 'H'], [8, H - 8, 'H']]);
  return cat(start, b1, land, b2, end);
}

// 6-7 Caminho das Lâmpadas: escadas invisíveis, morcegos e lâmpadas que guiam.
function l67(): string[] {
  const start = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@'], [10, H - 8, '0'], [5, H - 7, ';']]);
  const stairs = (() => {
    let s = gap(40, H);
    s = box(s, 0, H - 3, 4, 3, '#');
    s = box(s, 0, 0, 40, 1, '%');
    for (let i = 0; i < 6; i++) s = put(s, 5 + i * 2, H - 5 - i, 'H');
    s = box(s, 17, H - 10, 6, 1, '#');
    s = dots(s, [[19, H - 11, 'c'], [20, H - 13, ';'], [16, 2, 'b']]);
    for (let i = 0; i < 6; i++) s = put(s, 24 + i * 2, H - 9 + i, 'H');
    s = box(s, 36, H - 3, 4, 3, '#');
    return dots(s, [[24, H - 12, 'p'], [30, 2, 'b'], [37, H - 7, ';']]);
  })();
  const grove = (() => {
    let s = flat(34, H, 3);
    s = box(s, 0, 0, 34, 1, '%');
    s = box(s, 8, H - 6, 2, 3, '#');
    s = box(s, 16, H - 8, 2, 5, '#');
    s = box(s, 24, H - 6, 2, 3, '#');
    s = dots(s, [[4, H - 4, 'n'], [9, H - 7, 'p'], [12, H - 4, 'f'], [20, H - 4, 'n'], [28, H - 4, 'f'], [17, H - 12, '?'], [5, H - 7, ';'], [21, H - 7, ';'], [30, H - 7, ';'], [12, 1, 'b'], [26, 1, 'b']]);
    return s;
  })();
  const end = dots(cat(stairsUp(H, 3, 3), flat(14, H, 6)), [[8, H - 7, 'b'], [10, H - 7, 'g'], [4, H - 9, ';'], [12, H - 11, 'p']]);
  return cat(start, stairs, grove, end);
}

// ======================================================================= Ilha 7

// 7-4 Velas Rasgadas: o navio avança sozinho (rolagem automática) entre mastros e redes.
function l74(): string[] {
  let s = flat(150, HT, 3);
  s = dots(s, [[3, HT - 4, 's'], [6, HT - 4, '@']]);
  for (const x of [14, 40, 66, 92, 118]) {
    s = vline(s, x, 3, HT - 6, ':');
    s = hline(s, x - 5, 5, 11, '=');
    s = hline(s, x - 3, 11, 7, '=');
    s = vline(s, x + 1, 6, HT - 9, 'V');
  }
  // buracos no convés
  for (const [x, w] of [[24, 4], [50, 5], [77, 4], [102, 5], [128, 4]] as [number, number][]) s = box(s, x, HT - 3, w, 3, '.');
  s = dots(s, [[10, HT - 4, 'w'], [20, HT - 4, 'ç'], [32, HT - 4, 'w'], [46, HT - 4, 'w'], [58, HT - 4, 'x'], [72, HT - 4, 'w'], [84, HT - 4, 'c'], [98, HT - 4, 'w'], [110, HT - 4, 'ç'], [124, HT - 4, 'w'], [136, HT - 4, 'w']]);
  s = dots(s, [[14, 4, 'p'], [66, 4, 'p'], [118, 4, 'p'], [40, 10, '$'], [41, 10, '$'], [92, 10, '$'], [93, 10, '$'], [30, 4, 'v'], [80, 3, 'v'], [106, 4, 'v'], [35, HT - 8, '?'], [36, HT - 8, '!']]);
  s = put(s, 144, HT - 4, 'g');
  return s;
}

// 7-5 Porão Inundado: água, névoa letal e a escada para a torre.
function l75(): string[] {
  const top = dots(flat(14, H, 3), [[3, H - 4, 's'], [7, H - 4, '@']]);
  const hold = (() => {
    let s = flat(80, H, 2, '%');
    s = box(s, 0, 0, 80, 1, '%');
    s = box(s, 0, H - 5, 30, 1, 'W');
    s = box(s, 0, H - 4, 30, 2, '~');
    s = dots(s, [[6, H - 3, 'ª'], [16, H - 3, 'j'], [24, H - 3, 'ª']]);
    s = box(s, 30, H - 4, 4, 2, '%');
    s = dots(s, [[31, H - 5, 'c']]);
    for (let x = 36; x < 60; x++) s = vline(s, x, H - 2, 2, 'X');
    s = dots(s, [[38, H - 6, 'z'], [43, H - 7, 'z'], [48, H - 6, 'z'], [53, H - 8, 'z'], [46, H - 11, 'p'], [12, H - 8, 'p'], [44, 1, 'b']]);
    s = box(s, 60, H - 4, 20, 2, '%');
    s = dots(s, [[64, H - 5, 'w'], [70, H - 5, 'w'], [67, H - 9, '?'], [68, H - 9, '+'], [74, H - 9, 'p'], [73, H - 8, '='], [74, H - 8, '='], [75, H - 8, '=']]);
    return s;
  })();
  const end = dots(cat(stairsUp(H, 4, 3), flat(14, H, 6)), [[6, H - 7, 'w'], [10, H - 7, 'g']]);
  return cat(top, hold, end);
}

// ======================================================================= Rota das Constelações

// C-5 Aurora: molas e plataformas que caem sobre o vazio.
function lc5(): string[] {
  let s = gap(92, H);
  s = box(s, 0, H - 3, 6, 3, '#');
  s = dots(s, [[2, H - 4, 's']]);
  const isl: [number, number][] = [[9, H - 4], [17, H - 6], [25, H - 4], [33, H - 6], [41, H - 3], [49, H - 5], [57, H - 4], [65, H - 6], [73, H - 4]];
  isl.forEach(([x, y], i) => {
    s = box(s, x, y, 3, 1, i % 2 ? 'F' : '#');
    if (i % 3 === 1) s = put(s, x + 1, y - 1, 'y');
  });
  s = dots(s, [[18, 1, 'p'], [42, 4, 'p'], [66, 1, 'p'], [22, H - 10, 'v'], [46, H - 11, 'v'], [62, H - 10, 'v']]);
  s = box(s, 80, H - 3, 12, 3, '#');
  s = put(s, 86, H - 4, 'g');
  return s;
}

// C-6 Eclipse: escuridão, pontes invisíveis e morcegos.
function lc6(): string[] {
  let s = gap(96, H);
  s = box(s, 0, 0, 96, 1, '%');
  s = box(s, 0, H - 3, 6, 3, '#');
  s = dots(s, [[2, H - 4, 's'], [4, H - 8, '0']]);
  const runs: [number, number, number][] = [[7, H - 5, 8], [18, H - 7, 6], [27, H - 5, 7], [37, H - 8, 6], [46, H - 6, 8], [57, H - 4, 6], [66, H - 7, 7], [76, H - 5, 6]];
  for (const [x, y, w] of runs) for (let i = 0; i < w; i++) s = put(s, x + i, y, 'H');
  s = dots(s, [[20, H - 9, 'p'], [39, H - 10, 'p'], [68, H - 9, 'p'], [14, 1, 'b'], [32, 1, 'b'], [52, 1, 'b'], [72, 1, 'b'], [31, H - 7, ';'], [60, H - 6, ';']]);
  s = box(s, 85, H - 3, 11, 3, '#');
  s = put(s, 90, H - 4, 'g');
  return s;
}

// C-7 Nebulosa: colunas de vento e pipas sobre o abismo.
function lc7(): string[] {
  let s = gap(92, HT);
  s = box(s, 0, HT - 3, 6, 3, '#');
  s = dots(s, [[2, HT - 4, 's'], [4, HT - 8, '+']]);
  [8, 22, 36, 50, 64].forEach((x, i) => {
    for (let xx = x; xx < x + 3; xx++) s = vline(s, xx, 3, HT - 6, '&');
    const py = i % 2 ? 8 : 5;
    s = hline(s, x + 4, py, 6, '=');
    s = put(s, x + 7, py + 1, 'i');
  });
  s = box(s, 0, HT - 1, 92, 1, 'X');
  s = dots(s, [[14, 1, 'p'], [56, 4, 'p'], [70, 1, 'p'], [19, 10, 'v'], [47, 10, 'v']]);
  s = box(s, 78, 8, 14, 1, '#');
  s = put(s, 86, 7, 'g');
  return s;
}

// C-8 Supernova: o teste final, em três salas.
function lc8(): string[][] {
  const a = (() => {
    let s = flat(60, H, 3);
    s = dots(s, [[3, H - 4, 's'], [7, H - 8, '?'], [8, H - 8, '+']]);
    for (let x = 12; x < 50; x++) s = vline(s, x, H - 3, 3, '.');
    const plats: [number, number][] = [[12, H - 5], [17, H - 7], [22, H - 5], [27, H - 8], [32, H - 6], [37, H - 9], [42, H - 6], [47, H - 4]];
    plats.forEach(([x, y], i) => { s = hline(s, x, y, 3, i % 2 ? 'F' : '='); });
    s = dots(s, [[28, H - 9, 'u'], [37, H - 12, 'p'], [20, H - 10, 'v'], [40, H - 11, 'v'], [54, H - 4, '1']]);
    return s;
  })();
  const b = (() => {
    let s = flat(50, H, 3, '%');
    s = box(s, 0, 0, 50, 1, '%');
    s = dots(s, [[2, H - 4, '1']]);
    s = box(s, 8, H - 6, 2, 3, '%');
    s = dots(s, [[12, H - 4, '¬'], [16, H - 4, 'w'], [20, H - 4, '°'], [24, H - 4, '°'], [30, H - 4, 'w'], [34, H - 4, '¬'], [40, H - 4, 'c']]);
    s = hline(s, 18, H - 7, 10, '=');
    s = dots(s, [[23, H - 8, 'p'], [46, H - 4, '2']]);
    return s;
  })();
  const c = (() => {
    let s = gap(50, HT);
    s = box(s, 0, HT - 3, 6, 3, '#');
    s = dots(s, [[2, HT - 4, '2']]);
    for (let x = 8; x < 11; x++) s = vline(s, x, 4, HT - 7, '&');
    s = hline(s, 12, 5, 8, '=');
    s = dots(s, [[15, 4, 'i'], [17, 1, 'p']]);
    s = hline(s, 22, 8, 3, 'F');
    s = hline(s, 28, 6, 3, 'F');
    s = hline(s, 34, 8, 3, 'F');
    s = box(s, 40, 8, 10, 1, '#');
    s = dots(s, [[44, 7, 'b'], [47, 7, 'g']]);
    s = box(s, 0, HT - 1, 50, 1, 'X');
    return s;
  })();
  return [a, b, c];
}

// ======================================================================= definições

export const EXPANSION: Record<number, LevelDef[]> = {
  1: [
    {
      id: '1-6', label: '1-4', name: 'MOLHE DOS PESCADORES', island: 1, theme: 'praia', music: 'praia', kind: 'normal',
      rooms: [{ map: l16() }],
      signs: ['OS BARCOS VAO E VEM. ESPERE O BARCO CHEGAR ANTES DE PULAR.'],
      hint: 'GAIVOTAS MERGULHAM QUANDO VOCE PASSA EMBAIXO.',
    },
  ],
  2: [
    {
      id: '2-6', label: '2-4', name: 'COGUMELOS SALTITANTES', island: 2, theme: 'bosque', music: 'bosque', kind: 'normal',
      rooms: [{ map: l26() }],
      signs: ['PULE NA MOLA E SEGURE Z PARA IR MAIS ALTO!'],
    },
    {
      id: '2-7', label: '2-5', name: 'TRONCO OCO', island: 2, theme: 'bosque', music: 'caverna', kind: 'normal', hasSecret: true,
      rooms: [{ map: l27() }],
      signs: ['SUBA POR DENTRO DO TRONCO. O ASSOALHO DE CIMA RANGE...'],
      hint: 'UMA CAMBALHOTA NO ASSOALHO RACHADO ABRE O CAMINHO PARA AS ESTRELAS.',
    },
  ],
  3: [
    {
      id: '3-6', label: '3-4', name: 'PONTE DE CORDA', island: 3, theme: 'penhasco', music: 'penhasco', kind: 'normal',
      rooms: [{ map: l36() }],
      signs: ['AS TABUAS DA PONTE QUEBRADA CAEM. NAO PARE!'],
    },
    {
      id: '3-7', label: '3-5', name: 'ESCARPA', island: 3, theme: 'penhasco', music: 'penhasco', kind: 'normal',
      rooms: [{ map: l37() }],
      signs: ['A SAIDA FICA LA NO ALTO. CORDAS, VENTO E REDES LEVAM ATE ELA.'],
    },
    {
      id: '3-8', label: '3-6', name: 'VENDAVAL', island: 3, theme: 'penhasco', music: 'penhasco', kind: 'normal',
      rooms: [{ map: l38(), wind: -0.012 }],
      signs: ['O VENTO SOPRA CONTRA VOCE. CORRA E PLANE COM A FOLHA.'],
      hint: 'COM O IMPETO CHEIO, NEM O VENDAVAL SEGURA VOCE.',
    },
  ],
  4: [
    {
      id: '4-6', label: '4-4', name: 'PRAIA DE CONCHAS', island: 4, theme: 'recife', music: 'recife', kind: 'normal',
      rooms: [{ map: l46() }],
      signs: ['AGUAS-VIVAS ACESAS MACHUCAM. ESPERE A LUZ APAGAR.'],
    },
    {
      id: '4-7', label: '4-5', name: 'ABISMO AZUL', island: 4, theme: 'recife', music: 'caverna', kind: 'normal', hasSecret: true,
      rooms: [{ map: l47(), water: { y: 1 }, dark: true }],
      signs: ['NO ESCURO DO ABISMO, A LANTERNA E SUA AMIGA.'],
      hint: 'NO FIM DO ABISMO HA UM ASSOALHO QUE QUEBRA.',
    },
    {
      id: '4-8', label: '4-6', name: 'MARE ALTA', island: 4, theme: 'recife', music: 'recife', kind: 'normal',
      rooms: [
        { map: l48()[0], tide: { base: 9, amp: 3, period: 660 } },
        { map: l48()[1], music: 'caverna', tide: { base: 9, amp: 4, period: 600 } },
      ],
      signs: ['A MARE SOBE E DESCE. NADE QUANDO ELA ESTIVER ALTA.'],
    },
  ],
  5: [
    {
      id: '5-6', label: '5-4', name: 'ESTEIRAS DE SAL', island: 5, theme: 'minas', music: 'minas', kind: 'normal',
      rooms: [{ map: l56() }],
      signs: ['ESTEIRAS EMPURRAM. GELO ESCORREGA. TABUAS VELHAS DESMORONAM.'],
    },
    {
      id: '5-7', label: '5-5', name: 'POCO DE SAL', island: 5, theme: 'minas', music: 'caverna', kind: 'normal', hasSecret: true,
      rooms: [{ map: l57() }],
      signs: ['CAMBALHOTA (C) EM CIMA DOS BLOCOS RACHADOS PARA DESCER.'],
      hint: 'UMA CORDA NO CANTO ESQUERDO DESCE ATE UM TUNEL ESQUECIDO.',
    },
    {
      id: '5-8', label: '5-6', name: 'TRILHO DUPLO', island: 5, theme: 'minas', music: 'minas', kind: 'normal',
      rooms: [{ map: l58() }],
      signs: ['DOIS VAGONETES, DUAS VIAGENS. AGACHE NOS TETOS BAIXOS!'],
    },
  ],
  6: [
    {
      id: '6-6', label: '6-4', name: 'PANTANO DE NEVOA', island: 6, theme: 'vale', music: 'vale', kind: 'normal',
      rooms: [{ map: l66(), dark: true }],
      signs: ['A NEVOA DO PANTANO E MORTAL. FANTOCHES SE ESCONDEM NELA.'],
    },
    {
      id: '6-7', label: '6-5', name: 'CAMINHO DAS LAMPADAS', island: 6, theme: 'vale', music: 'vale', kind: 'normal',
      rooms: [{ map: l67(), dark: true }],
      signs: ['DEGRAUS INVISIVEIS SOBEM PELA ESCURIDAO. ATIRE LUZ PARA VE-LOS.'],
    },
  ],
  7: [
    {
      id: '7-4', label: '7-3', name: 'VELAS RASGADAS', island: 7, theme: 'navio', music: 'navio', kind: 'normal',
      rooms: [{ map: l74(), autoscroll: 0.8 }],
      signs: ['O NAVIO NAO ESPERA! SUBA NAS REDES QUANDO O CONVES ACABAR.'],
    },
    {
      id: '7-5', label: '7-4', name: 'PORAO INUNDADO', island: 7, theme: 'navio', music: 'caverna', kind: 'normal',
      rooms: [{ map: l75() }],
      signs: ['ABAIXO DO PORAO, A ESCADA DA TORRE.'],
    },
  ],
  8: [
    { id: 'C-5', name: 'AURORA', island: 8, theme: 'ceu', music: 'ceu', kind: 'desafio', rooms: [{ map: lc5() }] },
    { id: 'C-6', name: 'ECLIPSE', island: 8, theme: 'ceu', music: 'ceu', kind: 'desafio', rooms: [{ map: lc6(), dark: true }] },
    { id: 'C-7', name: 'NEBULOSA', island: 8, theme: 'ceu', music: 'ceu', kind: 'desafio', rooms: [{ map: lc7() }] },
    {
      id: 'C-8', name: 'SUPERNOVA', island: 8, theme: 'ceu', music: 'chefefinal', kind: 'desafio',
      rooms: [{ map: lc8()[0] }, { map: lc8()[1], theme: 'forte' }, { map: lc8()[2] }],
    },
  ],
};
