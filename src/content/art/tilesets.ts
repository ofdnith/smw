/**
 * Tilesets procedurais 16 bits por ambientação. Cada tile é desenhado em código:
 * contorno escuro nas bordas expostas, borda de grama/areia caindo sobre o barranco,
 * cantos arredondados, textura própria por ilha e blocos com bisel e brilho.
 * As texturas usam coordenadas de mundo para continuar de um tile para o outro.
 */
import type { Palette, Frame } from '../../engine/sprites';
import { compileFrame } from '../../engine/sprites';
import { ramp } from '../../engine/pixelart';
import { g, Grid } from './gen';
import { T } from '../../game/level/tiles';
import type { Theme } from '../../game/level/format';

type Style = 'sand' | 'dirt' | 'darkdirt' | 'strata' | 'coral' | 'salt' | 'bricks' | 'planks' | 'cloud';
type TopStyle = 'sand' | 'grass' | 'coral' | 'salt' | 'cloud' | 'none';
interface ThemeDef {
  outline: string; ground: string; top: string; stone: string; block: string; water: string;
  style: Style; topStyle: TopStyle; death: 'fog' | 'lava';
}

const DEFS: Record<Theme, ThemeDef> = {
  praia: { outline: '#5a3414', ground: '#e2b878', top: '#f8e6b0', stone: '#a8988a', block: '#d08a4a', water: '#3fa7d6', style: 'sand', topStyle: 'sand', death: 'fog' },
  bosque: { outline: '#1a2410', ground: '#8e5c34', top: '#5cc23e', stone: '#6a7a5a', block: '#a06c3a', water: '#2f8a7a', style: 'dirt', topStyle: 'grass', death: 'fog' },
  penhasco: { outline: '#20202c', ground: '#9494aa', top: '#78d05a', stone: '#6a6a82', block: '#a87c52', water: '#4fa3d8', style: 'strata', topStyle: 'grass', death: 'fog' },
  recife: { outline: '#2a1a3a', ground: '#e4aa72', top: '#ff94c4', stone: '#5a7c92', block: '#d08a4a', water: '#2f8fcf', style: 'coral', topStyle: 'coral', death: 'fog' },
  minas: { outline: '#2c2c3c', ground: '#d6cfc0', top: '#fbfaf4', stone: '#8a8a9c', block: '#ae946c', water: '#4fa3d8', style: 'salt', topStyle: 'salt', death: 'lava' },
  vale: { outline: '#08080f', ground: '#3e3656', top: '#3e7e5c', stone: '#44445e', block: '#6e5c80', water: '#2a4a6a', style: 'darkdirt', topStyle: 'grass', death: 'fog' },
  farol: { outline: '#14141e', ground: '#9ea2b2', top: '#c6cad6', stone: '#6a6f80', block: '#b07a42', water: '#2f4f7f', style: 'bricks', topStyle: 'none', death: 'fog' },
  ceu: { outline: '#4a4a8e', ground: '#e6ecff', top: '#ffffff', stone: '#9ab0e8', block: '#ffd24a', water: '#4fa3d8', style: 'cloud', topStyle: 'cloud', death: 'fog' },
  forte: { outline: '#140e18', ground: '#6e5e84', top: '#8e80a6', stone: '#4c4c62', block: '#9a6a3a', water: '#3f2f5f', style: 'bricks', topStyle: 'none', death: 'lava' },
  navio: { outline: '#140e10', ground: '#a06e40', top: '#c09058', stone: '#4c4c5c', block: '#9a6a3a', water: '#1f3a5f', style: 'planks', topStyle: 'none', death: 'fog' },
};

// rampas de 5 tons -> caracteres da grade
const K = {
  ground: '12345', top: '67890', stone: 'LMNPQ', block: 'UVXZ!', water: 'CDEGH',
  gold: 'cehij', wood: 'lmnpq', metal: 'suvxz', hazard: 'IJSY@', ice: '<>{}[',
};
const GOLD = '#ffc53a', WOOD = '#b98048', METAL = '#9aa0b0', ICE = '#9fdcff';

export interface ThemePalette extends Palette {
  '.': null;
  /** cor base da água (maré) */
  a: string;
}

function buildPalette(d: ThemeDef): ThemePalette {
  const p: Palette = { '.': null, k: d.outline, w: '#ffffff', y: '#ffd24a', K: '#6b3a0a', o: '#ff9f2e', O: '#e07a12' };
  const add = (keys: string, base: string): void => { const r = ramp(base); for (let i = 0; i < 5; i++) p[keys[i]] = r[i]; };
  add(K.ground, d.ground); add(K.top, d.top); add(K.stone, d.stone); add(K.block, d.block); add(K.water, d.water);
  add(K.gold, GOLD); add(K.wood, WOOD); add(K.metal, METAL); add(K.ice, ICE);
  add(K.hazard, d.death === 'lava' ? '#ff8a2a' : '#8a6aa8');
  return { ...(p as ThemePalette), a: d.water };
}

export const THEMES: Record<Theme, ThemePalette> = Object.fromEntries(Object.entries(DEFS).map(([k, d]) => [k, buildPalette(d)])) as Record<Theme, ThemePalette>;

const cache = new Map<string, Frame>();

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

const ANIMATED = new Set<T>([T.Amber, T.Conveyor, T.ConveyorL, T.WaterTop, T.Water, T.WindUp, T.Death, T.Lamp, T.ItemPower]);

/** Máscara de vizinhos sólidos: 1 cima, 2 direita, 4 baixo, 8 esquerda. */
export function tileFrame(theme: Theme, t: T, mask: number, tx: number, ty: number, anim: number): Frame | null {
  // variação: a textura depende da posição no mundo; agrupa em 8 colunas x 4 linhas para cache
  const vx = ((tx % 8) + 8) % 8, vy = ((ty % 4) + 4) % 4;
  const key = `${theme}:${t}:${mask}:${vx}:${vy}:${ANIMATED.has(t) ? anim % 4 : 0}`;
  const c = cache.get(key);
  if (c) return c;
  const grid = drawTile(DEFS[theme], t, mask, anim % 4, vx, vy);
  if (!grid) return null;
  const f = compileFrame(grid.toString(), THEMES[theme]);
  cache.set(key, f);
  return f;
}

// ------------------------------------------------------------------ texturas de preenchimento

function fillBody(G: Grid, d: ThemeDef, tx: number, ty: number, keys = K.ground): void {
  const R = keys;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const wx = tx * 16 + x, wy = ty * 16 + y;
      let t = 2;
      switch (d.style) {
        case 'sand': case 'coral': {
          const h = hash(wx, wy) % 23;
          t = h === 0 ? 1 : h === 1 ? 3 : 2;
          if (d.style === 'coral' && hash(wx >> 2, wy >> 2) % 13 === 0 && h < 6) t = 3;
          break;
        }
        case 'dirt': case 'darkdirt': {
          // seixos de 3x2 espalhados em grade irregular
          const cx = Math.floor(wx / 6), cy = Math.floor(wy / 5);
          const hh = hash(cx, cy);
          const px = cx * 6 + (hh % 3), py = cy * 5 + ((hh >> 3) % 2);
          if (hh % 3 === 0 && wx >= px && wx < px + 3 && wy >= py && wy < py + 2) t = wy === py && wx === px ? 3 : wy === py ? 2 : 1;
          else t = hash(wx, wy) % 19 === 0 ? 1 : 2;
          if (d.style === 'darkdirt' && t === 3) t = 2;
          break;
        }
        case 'strata': {
          const band = Math.floor((wy + Math.floor(Math.sin(wx / 9) * 1.5)) / 6);
          const iy = (wy + Math.floor(Math.sin(wx / 9) * 1.5)) % 6;
          t = iy === 0 ? 1 : iy === 1 ? 3 : band % 2 ? 2 : 2;
          if (iy === 0 && hash(wx >> 3, band) % 4 === 0) t = 2;
          if (t === 2 && hash(wx, wy) % 29 === 0) t = 1;
          break;
        }
        case 'salt': case 'bricks': {
          const row = Math.floor(wy / 8), off = row % 2 ? 8 : 0;
          const bx = (wx + off) % 16, by = wy % 8;
          t = by === 7 || bx === 15 ? 0 : by === 0 || bx === 0 ? 3 : by === 6 || bx === 14 ? 1 : 2;
          if (t === 2 && hash(wx, wy) % 31 === 0) t = 1;
          if (d.style === 'salt' && t === 2 && hash(wx >> 1, wy >> 1) % 17 === 0) t = 4;
          break;
        }
        case 'planks': {
          const py = wy % 6, seam = (Math.floor(wy / 6) * 11) % 32;
          t = py === 5 ? 0 : py === 0 ? 3 : 2;
          if ((wx + seam) % 32 === 0 && py !== 5) t = 0;
          if (py === 2 && (wx + seam) % 32 === 2) t = 4; // prego
          if (t === 2 && hash(wx, wy >> 1) % 9 === 0) t = 1;
          break;
        }
        case 'cloud': {
          const b = Math.sin(wx / 5) * 1.5 + Math.sin(wy / 4 + wx / 7);
          t = b > 1.2 ? 4 : b < -1.3 ? 2 : 3;
          break;
        }
      }
      G.set(x, y, R[t]);
    }
}

// ------------------------------------------------------------------ bordas

function topLip(G: Grid, d: ThemeDef, tx: number, surface: (x: number) => number): void {
  const TP = K.top;
  for (let x = 0; x < 16; x++) {
    const s = surface(x);
    if (s < 0 || s > 15) continue;
    const wx = tx * 16 + x;
    G.set(x, s, 'k');
    if (d.topStyle === 'none') {
      G.set(x, s + 1, K.ground[4]);
      G.set(x, s + 2, K.ground[3]);
      continue;
    }
    let len = 3;
    if (d.topStyle === 'grass') len = 3 + (hash(wx, 7) % 3) + ((wx % 7) === 3 ? 1 : 0);
    else if (d.topStyle === 'sand' || d.topStyle === 'coral' || d.topStyle === 'salt') len = 3 + (Math.sin(wx / 3.1) > 0.4 ? 1 : 0);
    else if (d.topStyle === 'cloud') len = 2;
    for (let i = 1; i <= len; i++) {
      const tone = i === 1 ? 4 : i === 2 ? 3 : i === len ? 1 : 2;
      G.set(x, s + i, TP[tone]);
    }
    // contorno sob a franja (grama/areia "caindo") e sombra no barranco
    if (d.topStyle !== 'cloud') {
      G.set(x, s + len + 1, 'k');
      G.set(x, s + len + 2, K.ground[1]);
    }
    // tufos e detalhes sobre a borda
    if (d.topStyle === 'grass' && hash(wx, 3) % 5 === 0 && s > 0) { G.set(x, s - 1, 'k'); G.set(x, s, TP[3]); }
    if (d.topStyle === 'coral' && hash(wx, 5) % 6 === 0) G.set(x, s + 2, 'w');
    if (d.topStyle === 'sand' && hash(wx, 9) % 9 === 0) G.set(x, s + 2, TP[1]);
  }
}

function edges(G: Grid, mask: number, d: ThemeDef, R = K.ground): void {
  const up = (mask & 1) !== 0, right = (mask & 2) !== 0, down = (mask & 4) !== 0, left = (mask & 8) !== 0;
  const isLip = (x: number, y: number): boolean => !up && K.top.includes(G.get(x, y));
  if (!left) for (let y = 0; y < 16; y++) { G.set(0, y, 'k'); if (G.get(1, y) !== 'k') G.set(1, y, isLip(1, y) ? K.top[3] : R[3]); }
  if (!right) for (let y = 0; y < 16; y++) { G.set(15, y, 'k'); if (G.get(14, y) !== 'k') G.set(14, y, isLip(14, y) ? K.top[1] : R[1]); }
  if (!down) for (let x = 0; x < 16; x++) { G.set(x, 15, 'k'); if (G.get(x, 14) !== 'k') G.set(x, 14, R[1]); }
  // cantos arredondados
  if (!up && !left) { G.set(0, 0, '.'); G.set(1, 0, '.'); G.set(0, 1, '.'); G.set(1, 1, 'k'); G.set(2, 0, 'k'); G.set(0, 2, 'k'); }
  if (!up && !right) { G.set(15, 0, '.'); G.set(14, 0, '.'); G.set(15, 1, '.'); G.set(14, 1, 'k'); G.set(13, 0, 'k'); G.set(15, 2, 'k'); }
  if (!down && !left) { G.set(0, 15, '.'); G.set(1, 14, 'k'); }
  if (!down && !right) { G.set(15, 15, '.'); G.set(14, 14, 'k'); }
  void d;
}

/** Bloco avulso com bisel (rachado, baú, usado, gelo). */
function bevelBlock(G: Grid, R: string): void {
  G.rect(0, 0, 16, 16, R[2]);
  G.rect(1, 1, 14, 1, R[4]); G.rect(1, 1, 1, 14, R[3]); G.rect(2, 2, 12, 1, R[3]);
  G.rect(1, 14, 14, 1, R[0]); G.rect(14, 1, 1, 14, R[1]); G.rect(2, 13, 12, 1, R[1]);
  G.rect(0, 0, 16, 1, 'k'); G.rect(0, 15, 16, 1, 'k'); G.rect(0, 0, 1, 16, 'k'); G.rect(15, 0, 1, 16, 'k');
  G.set(1, 1, 'k'); G.set(14, 1, 'k'); G.set(1, 14, 'k'); G.set(14, 14, 'k');
}

function starfish(G: Grid, R: string, cx: number, cy: number): void {
  const arms: [number, number][] = [[0, -4], [4, -1], [2, 4], [-2, 4], [-4, -1]];
  for (const [ax, ay] of arms) G.line(cx, cy, cx + ax, cy + ay, R[1]);
  for (const [ax, ay] of arms) G.set(cx + Math.round(ax * 0.6) - 1, cy + Math.round(ay * 0.6) - (ay < 0 ? 0 : 1), R[4]);
  G.set(cx, cy, R[0]);
}

// ------------------------------------------------------------------ tiles

function drawTile(d: ThemeDef, t: T, mask: number, anim: number, tx: number, ty: number): Grid | null {
  const G = g(16, 16);
  const up = (mask & 1) !== 0;
  switch (t) {
    case T.Solid: {
      fillBody(G, d, tx, ty);
      if (!up) topLip(G, d, tx, () => 0);
      edges(G, mask, d);
      return G;
    }
    case T.Rock: {
      // pedra de caverna: pedras irregulares com argamassa
      const S = K.stone;
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const wx = tx * 16 + x, wy = ty * 16 + y;
          const cy = Math.floor(wy / 7), off = (hash(0, cy) % 7);
          const cx = Math.floor((wx + off) / 9);
          const lx = (wx + off) % 9, ly = wy % 7;
          let tn = lx === 8 || ly === 6 ? 0 : lx === 0 || ly === 0 ? 3 : lx === 7 || ly === 5 ? 1 : 2;
          if (tn === 2 && hash(cx, cy) % 4 === 0) tn = 1;
          G.set(x, y, S[tn]);
        }
      if (!up) { G.rect(0, 0, 16, 1, 'k'); G.rect(0, 1, 16, 1, S[4]); }
      edges(G, mask, d, S);
      return G;
    }
    case T.Platform: {
      const W = K.wood;
      G.rect(0, 0, 16, 1, 'k');
      G.rect(0, 1, 16, 1, W[4]); G.rect(0, 2, 16, 2, W[3]); G.rect(0, 4, 16, 1, W[1]);
      G.rect(0, 5, 16, 1, 'k');
      G.set(7, 2, W[0]); G.set(7, 3, W[0]); G.set(15, 2, W[0]); G.set(15, 3, W[0]);
      G.set(2, 2, W[4]); G.set(10, 2, W[4]);
      if (d.topStyle === 'grass') { for (let x = 0; x < 16; x += 3) G.set(x + (tx % 2), 1, K.top[3]); }
      // suportes pendurados
      G.set(3, 6, 'k'); G.set(12, 6, 'k'); G.set(3, 7, W[0]); G.set(12, 7, W[0]);
      return G;
    }
    case T.Bridge: {
      const W = K.wood;
      G.rect(0, 3, 16, 1, W[3]);
      for (let x = 0; x < 16; x++) if (x % 4 !== 3) { G.set(x, 4, W[4]); G.set(x, 5, W[2]); G.set(x, 6, W[1]); G.set(x, 7, 'k'); }
      G.rect(0, 2, 16, 1, 'k');
      for (let x = 1; x < 16; x += 4) G.set(x, 3, W[0]);
      return G;
    }
    case T.Crack: {
      bevelBlock(G, K.block);
      const B = K.block;
      G.line(3, 2, 7, 7, B[0]); G.line(7, 7, 5, 13, B[0]); G.line(7, 7, 12, 9, B[0]); G.line(12, 9, 13, 13, B[0]); G.line(9, 2, 10, 5, B[0]);
      G.line(4, 3, 8, 8, B[3]); G.line(8, 8, 12, 10, B[3]);
      return G;
    }
    case T.ItemAmber:
    case T.ItemPower: {
      bevelBlock(G, K.gold);
      starfish(G, K.gold, 8, 8);
      if (t === T.ItemPower) {
        // brilho que percorre o bloco
        const sx = 3 + anim * 3;
        G.set(sx, 3, 'w'); G.set(sx + 1, 4, K.gold[4]); G.set(sx - 1, 4, K.gold[4]);
        G.set(8, 8, 'w');
      } else {
        G.set(4, 3, 'w');
      }
      return G;
    }
    case T.Used: {
      bevelBlock(G, K.block.split('').map((c, i) => K.block[Math.max(0, i - 1)]).join(''));
      G.set(5, 5, K.block[0]); G.set(10, 5, K.block[0]); G.set(5, 10, K.block[0]); G.set(10, 10, K.block[0]);
      return G;
    }
    case T.Hidden:
      return null;
    case T.SlopeUp:
    case T.SlopeDown:
    case T.GentleUpLo:
    case T.GentleUpHi:
    case T.GentleDownHi:
    case T.GentleDownLo: {
      fillBody(G, d, tx, ty);
      const surf = (x: number): number => Math.floor(16 - Math.max(slopeH(t, x), slopeH(t, x + 1)));
      for (let x = 0; x < 16; x++) for (let y = 0; y < surf(x); y++) G.set(x, y, '.');
      topLip(G, d, tx, surf);
      return G;
    }
    case T.Spike: {
      const S = K.metal;
      for (let i = 0; i < 4; i++) {
        const x = i * 4;
        for (let y = 5; y < 15; y++) {
          const half = ((y - 5) / 10) * 2;
          for (let xx = Math.round(x + 2 - half); xx <= Math.round(x + 1 + half); xx++) G.set(xx, y, xx <= x + 1 ? S[3] : S[1]);
        }
        G.set(x + 1, 4, 'k'); G.set(x + 2, 4, 'k'); G.set(x + 1, 5, S[4]);
      }
      G.rect(0, 14, 16, 2, S[0]); G.rect(0, 15, 16, 1, 'k');
      return G;
    }
    case T.Water: {
      const W = K.water;
      G.rect(0, 0, 16, 16, W[2]);
      for (let i = 0; i < 3; i++) {
        const y = (i * 6 + anim * 2 + ty * 5) % 16, x = (hash(tx, i) % 12);
        G.set(x, y, W[3]); G.set(x + 1, y, W[3]); G.set(x + 2, y, W[4]);
      }
      return G;
    }
    case T.WaterTop: {
      const W = K.water;
      G.rect(0, 3, 16, 13, W[2]);
      for (let x = 0; x < 16; x++) {
        const y = 3 + Math.round(Math.sin((x + anim * 2 + tx * 4) / 2.5));
        for (let yy = 0; yy < y; yy++) G.set(x, yy, '.');
        G.set(x, y, 'w'); G.set(x, y + 1, W[4]); G.set(x, y + 2, W[3]);
      }
      return G;
    }
    case T.Rope: {
      const W = K.wood;
      for (let y = 0; y < 16; y++) {
        G.set(6, y, 'k'); G.set(9, y, 'k');
        const tw = (y + ty * 16) % 4;
        G.set(7, y, tw < 2 ? W[4] : W[2]); G.set(8, y, tw < 2 ? W[2] : W[1]);
      }
      return G;
    }
    case T.Net: {
      const W = K.wood;
      for (let i = 0; i < 16; i += 4) for (let j = 0; j < 16; j++) { G.set(i, j, W[2]); G.set(j, i, W[3]); }
      for (let i = 0; i < 16; i += 4) for (let j = 0; j < 16; j += 4) G.set(i, j, W[4]);
      return G;
    }
    case T.Death: {
      const H = K.hazard;
      if (d.death === 'lava') {
        G.rect(0, 0, 16, 16, H[2]);
        for (let y = 6; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(x + tx * 16, y + anim) % 9 === 0) G.set(x, y, H[3]);
        for (let x = 0; x < 16; x++) {
          const y = 1 + Math.round(Math.sin((x + anim * 2 + tx * 5) / 2.5));
          for (let yy = 0; yy < y; yy++) G.set(x, yy, '.');
          G.set(x, y, H[4]); G.set(x, y + 1, H[3]);
        }
        const b = hash(tx, anim) % 12;
        G.set(b + 2, 5, H[4]); G.set(b + 2, 4, 'w');
      } else {
        G.rect(0, 0, 16, 16, H[1]);
        for (let i = 0; i < 10; i++) { const h = hash(tx * 3 + i + anim, ty * 5 + i); G.set(h % 16, (h >> 4) % 16, H[(h >> 8) % 2 ? 2 : 3]); }
        for (let x = 0; x < 16; x++) {
          const y = Math.round(Math.sin((x + anim * 2 + tx * 3) / 3) * 1.5) + 2;
          for (let yy = 0; yy < y; yy++) G.set(x, yy, '.');
          G.set(x, y, H[3]); G.set(x, y + 1, H[2]);
        }
      }
      return G;
    }
    case T.WindUp:
      for (let i = 0; i < 3; i++) {
        const y = 15 - ((anim * 3 + i * 6) % 16);
        G.set(3 + i * 5, y, 'w'); G.set(3 + i * 5, y + 1, 'w'); G.set(3 + i * 5, y + 2, K.water[4]);
      }
      return G;
    case T.Amber: {
      const fr = ['...kk...\n..kowk..\n.kooowk.\n.koooOk.\n.kOoOOk.\n..kOOk..\n...kk...', '...kk...\n..kwk...\n..kook..\n..kOok..\n..kOOk..\n..kOk...\n...kk...', '...kk...\n..kwok..\n.kwoook.\n.koOoOk.\n.kOOOOk.\n..kOOk..\n...kk...', '...kk...\n...kwk..\n..kook..\n..koOk..\n..kOOk..\n...kOk..\n...kk...'];
      G.blit(4, 4, fr[anim].replace(/k/g, 'K'));
      return G;
    }
    case T.Crumble: {
      const W = K.wood;
      G.rect(0, 0, 16, 1, 'k');
      G.rect(0, 1, 16, 1, W[3]); G.rect(0, 2, 16, 2, W[1]); G.rect(0, 4, 16, 1, W[0]); G.rect(0, 5, 16, 1, 'k');
      G.set(4, 1, 'k'); G.set(5, 2, 'k'); G.set(9, 3, 'k'); G.set(13, 1, 'k'); G.set(12, 2, 'k');
      for (const x of [1, 2, 10]) G.set(x, 1, K.top[2]);
      return G;
    }
    case T.Ice: {
      const I = K.ice;
      G.rect(0, 0, 16, 16, I[2]);
      G.line(3, 13, 12, 2, I[4]); G.line(6, 14, 14, 5, I[3]); G.line(1, 8, 6, 2, I[3]);
      if (!up) { G.rect(0, 0, 16, 1, 'k'); G.rect(0, 1, 16, 1, 'w'); }
      edges(G, mask, d, I);
      return G;
    }
    case T.Conveyor:
    case T.ConveyorL: {
      const S = K.metal;
      G.rect(0, 0, 16, 16, S[1]);
      for (let y = 6; y < 16; y += 5) for (let x = 2; x < 16; x += 6) G.set(x, y, S[3]);
      G.rect(0, 0, 16, 1, 'k'); G.rect(0, 1, 16, 4, S[0]); G.rect(0, 5, 16, 1, 'k');
      const dir = t === T.Conveyor ? 1 : -1;
      for (let x = 0; x < 16; x += 4) {
        const cx = (((x + anim * dir) % 16) + 16) % 16;
        G.set(cx, 2, S[4]); G.set((cx + dir + 16) % 16, 3, S[3]); G.set(cx, 4, S[2]);
      }
      G.rect(0, 15, 16, 1, 'k');
      return G;
    }
    case T.Pillar: {
      const S = K.stone;
      for (let y = 0; y < 16; y++) {
        G.set(4, y, 'k'); G.set(11, y, 'k');
        G.set(5, y, S[3]); G.set(6, y, S[3]); G.set(7, y, S[2]); G.set(8, y, S[2]); G.set(9, y, S[1]); G.set(10, y, S[1]);
      }
      if (ty % 4 === 0) { G.rect(3, 0, 10, 1, 'k'); G.rect(3, 1, 10, 1, S[3]); G.rect(3, 2, 10, 1, 'k'); }
      return G;
    }
    case T.Lamp: {
      const S = K.metal;
      G.rect(7, 0, 2, 5, S[1]);
      G.rect(4, 5, 8, 1, 'k'); G.rect(4, 12, 8, 1, 'k'); G.rect(4, 5, 1, 8, 'k'); G.rect(11, 5, 1, 8, 'k');
      G.rect(5, 6, 6, 6, 'y');
      G.rect(6, 7, 3, 3, 'w');
      if (anim % 2) G.set(9, 9, 'w'); else G.set(6, 10, 'y');
      G.rect(5, 13, 6, 1, S[0]);
      return G;
    }
    default:
      return null;
  }
}

function slopeH(t: T, x: number): number {
  const lx = Math.max(0, Math.min(16, x));
  switch (t) {
    case T.SlopeUp: return lx;
    case T.SlopeDown: return 16 - lx;
    case T.GentleUpLo: return lx / 2;
    case T.GentleUpHi: return 8 + lx / 2;
    case T.GentleDownHi: return 16 - lx / 2;
    case T.GentleDownLo: return 8 - lx / 2;
    default: return 0;
  }
}
