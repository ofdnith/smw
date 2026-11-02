/** Tilesets procedurais por tema: cada tile é desenhado em código com a paleta da ilha. */
import type { Palette, Frame } from '../../engine/sprites';
import { compileFrame } from '../../engine/sprites';
import { g, Grid } from './gen';
import { T } from '../../game/level/tiles';
import type { Theme } from '../../game/level/format';

export interface ThemePalette extends Palette {
  '.': null;
  k: string; // contorno
  t: string; // topo (grama/areia/musgo)
  T: string; // topo claro
  f: string; // preenchimento
  F: string; // preenchimento escuro
  d: string; // detalhe
  r: string; // pedra
  R: string; // pedra escura
  b: string; // bloco
  B: string; // bloco escuro
  w: string; // branco/brilho
  a: string; // água
  A: string; // água escura
  y: string; // amarelo (baú)
}

export const THEMES: Record<Theme, ThemePalette> = {
  praia: { '.': null, k: '#5a3a1a', t: '#f2dca6', T: '#fff2c8', f: '#d9b77a', F: '#b8934f', d: '#e8c98a', r: '#9a8a78', R: '#6a5c4e', b: '#c98a4a', B: '#8a5a2a', w: '#ffffff', a: '#3fa7d6', A: '#2b7fb0', y: '#ffd24a' },
  bosque: { '.': null, k: '#1f2a14', t: '#6fbf4a', T: '#a8e07a', f: '#6a4a2e', F: '#4a3220', d: '#8a6a3a', r: '#5a6a4a', R: '#3a4a30', b: '#8a6a3a', B: '#5a4220', w: '#e8ffd8', a: '#2f7f6f', A: '#1f5a4f', y: '#ffd24a' },
  penhasco: { '.': null, t: '#8fd17a', T: '#c8f0a8', k: '#2a2a3a', f: '#8a8a9a', F: '#5a5a6a', d: '#a8a8b8', r: '#6a6a7a', R: '#4a4a5a', b: '#9a7a5a', B: '#6a4a30', w: '#ffffff', a: '#4fa3d8', A: '#2f6f9f', y: '#ffd24a' },
  recife: { '.': null, k: '#2a2a4a', t: '#f49ac1', T: '#ffd0e4', f: '#d9a066', F: '#a86f3e', d: '#f2c98a', r: '#5a7a8a', R: '#3a5a6a', b: '#c98a4a', B: '#8a5a2a', w: '#ffffff', a: '#2f8fcf', A: '#1f5f9f', y: '#ffd24a' },
  minas: { '.': null, k: '#3a3a4a', t: '#f0ece0', T: '#ffffff', f: '#c8c4b8', F: '#9a968a', d: '#e0dcd0', r: '#7a7a8a', R: '#5a5a6a', b: '#a08a68', B: '#6a5a48', w: '#ffffff', a: '#4fa3d8', A: '#2f6f9f', y: '#ffd24a' },
  vale: { '.': null, k: '#0f0f1a', t: '#3a6a4a', T: '#5a9a6a', f: '#2a2a3a', F: '#1a1a2a', d: '#3a3a4a', r: '#3a3a4a', R: '#2a2a3a', b: '#5a4a6a', B: '#3a2a4a', w: '#c8f0ff', a: '#1f3f5f', A: '#0f2a3f', y: '#ffd24a' },
  farol: { '.': null, k: '#1a1a2a', t: '#c9ccd6', T: '#ffffff', f: '#8a8f9e', F: '#5a5f6e', d: '#a8adbc', r: '#6a6f7e', R: '#4a4f5e', b: '#a06a3a', B: '#7a4a22', w: '#ffffff', a: '#2f4f7f', A: '#1f3a5f', y: '#ffd24a' },
  ceu: { '.': null, k: '#2a2a5a', t: '#ffffff', T: '#ffffff', f: '#dfe8ff', F: '#b9c6ee', d: '#eef3ff', r: '#8fa8dd', R: '#6a88c0', b: '#ffd24a', B: '#c9961a', w: '#ffffff', a: '#4fa3d8', A: '#2f6f9f', y: '#ffd24a' },
  forte: { '.': null, k: '#1a1218', t: '#7a6a8a', T: '#9a8aaa', f: '#5a4a6a', F: '#3a2a4a', d: '#6a5a7a', r: '#4a4a5a', R: '#2a2a3a', b: '#8a6a3a', B: '#5a4220', w: '#ffffff', a: '#3f2f5f', A: '#2a1f3f', y: '#ffd24a' },
  navio: { '.': null, k: '#1a1218', t: '#a8844a', T: '#c9a66b', f: '#6a4a2e', F: '#4a3220', d: '#8a6a3a', r: '#4a4a5a', R: '#2a2a3a', b: '#8a6a3a', B: '#5a4220', w: '#ffffff', a: '#1f3a5f', A: '#0f2a4f', y: '#ffd24a' },
};

const cache = new Map<string, Frame>();

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

/** Máscara de vizinhos sólidos: 1 cima, 2 direita, 4 baixo, 8 esquerda. */
export function tileFrame(theme: Theme, t: T, mask: number, tx: number, ty: number, anim: number): Frame | null {
  const variant = hash(tx, ty) % 3;
  const key = `${theme}:${t}:${mask}:${variant}:${t === T.Amber || t === T.Conveyor || t === T.ConveyorL || t === T.WaterTop || t === T.Water || t === T.WindUp || t === T.Death || t === T.Lamp ? anim % 4 : 0}`;
  const c = cache.get(key);
  if (c) return c;
  const pal = THEMES[theme];
  const grid = drawTile(theme, t, mask, variant, anim % 4, tx, ty);
  if (!grid) return null;
  const f = compileFrame(grid.toString(), pal);
  cache.set(key, f);
  return f;
}

function drawTile(theme: Theme, t: T, mask: number, variant: number, anim: number, tx: number, ty: number): Grid | null {
  const G = g(16, 16);
  const up = (mask & 1) !== 0, right = (mask & 2) !== 0, down = (mask & 4) !== 0, left = (mask & 8) !== 0;
  switch (t) {
    case T.Solid: {
      G.rect(0, 0, 16, 16, 'f');
      // textura
      for (let i = 0; i < 4; i++) {
        const h = hash(tx * 7 + i, ty * 13 + variant);
        G.set(h % 16, (h >> 4) % 16, 'F');
        G.set((h >> 8) % 16, (h >> 12) % 16, 'd');
      }
      if (!up) {
        // topo com relevo
        G.rect(0, 0, 16, 3, 't');
        G.rect(0, 0, 16, 1, 'T');
        if (theme === 'bosque' || theme === 'penhasco' || theme === 'vale') {
          // tufos de grama
          for (let i = 0; i < 16; i += 3 + (variant % 2)) if (hash(tx * 3 + i, ty) % 3 > 0) { G.set(i, 3, 't'); G.set(i + 1, 3, 't'); }
          G.set((variant * 5 + 2) % 16, 0, 'T');
        } else if (theme === 'praia' || theme === 'recife') {
          // conchinhas
          if (variant === 1) { G.set(5, 1, 'w'); G.set(6, 1, 'w'); }
          if (variant === 2) { G.set(11, 1, 'd'); }
        } else if (theme === 'minas') {
          for (let i = 0; i < 16; i += 4) G.set(i + variant, 2, 'T');
        } else if (theme === 'forte' || theme === 'farol' || theme === 'navio') {
          G.rect(0, 0, 16, 3, 't');
          G.rect(0, 3, 16, 1, 'k');
        } else if (theme === 'ceu') {
          G.rect(0, 0, 16, 4, 'T');
        }
        G.rect(0, 3, 16, 1, 'F');
      }
      if (!down) G.rect(0, 15, 16, 1, 'F');
      if (!left) { G.rect(0, 0, 1, 16, 'F'); if (!up) G.set(0, 0, 'T'); }
      if (!right) { G.rect(15, 0, 1, 16, 'F'); }
      if (theme === 'forte' || theme === 'farol' || theme === 'navio' || theme === 'minas') {
        // tijolos / tábuas
        const off = ty % 2 === 0 ? 0 : 8;
        G.rect(0, 7, 16, 1, 'F');
        G.rect((off + 4) % 16, 8, 1, 8, 'F');
        G.rect((off + 12) % 16, 0, 1, 7, 'F');
        if (theme === 'navio') { G.rect(0, 11, 16, 1, 'F'); }
      }
      return G;
    }
    case T.Rock:
      G.rect(0, 0, 16, 16, 'r');
      for (let i = 0; i < 5; i++) {
        const h = hash(tx * 11 + i, ty * 17 + variant);
        G.set(h % 16, (h >> 4) % 16, 'R');
      }
      if (!up) G.rect(0, 0, 16, 1, 'd');
      if (!down) G.rect(0, 15, 16, 1, 'R');
      if (!left) G.rect(0, 0, 1, 16, 'd');
      if (!right) G.rect(15, 0, 1, 16, 'R');
      {
        const off = ty % 2 === 0 ? 0 : 8;
        G.rect(0, 7, 16, 1, 'R');
        G.rect((off + 3) % 16, 8, 1, 8, 'R');
        G.rect((off + 11) % 16, 0, 1, 7, 'R');
      }
      return G;
    case T.Platform:
      G.rect(0, 0, 16, 2, 'T');
      G.rect(0, 2, 16, 3, 'b');
      G.rect(0, 5, 16, 1, 'k');
      if (theme === 'bosque') { G.rect(0, 0, 16, 2, 't'); }
      G.set(3, 3, 'B'); G.set(10, 3, 'B');
      return G;
    case T.Bridge:
      G.rect(0, 4, 16, 2, 'b');
      G.rect(0, 6, 16, 1, 'B');
      for (let i = 1; i < 16; i += 4) G.set(i, 5, 'k');
      return G;
    case T.Crack:
      G.rect(0, 0, 16, 16, 'b');
      G.rect(0, 0, 16, 1, 'T'); G.rect(0, 0, 1, 16, 'T');
      G.rect(15, 0, 1, 16, 'B'); G.rect(0, 15, 16, 1, 'B');
      G.line(3, 2, 7, 7, 'k'); G.line(7, 7, 5, 13, 'k'); G.line(7, 7, 12, 9, 'k'); G.line(12, 9, 13, 13, 'k');
      G.line(9, 2, 10, 5, 'k');
      return G;
    case T.ItemAmber:
    case T.ItemPower:
      G.rect(0, 0, 16, 16, 'y');
      G.rect(0, 0, 16, 1, 'w'); G.rect(0, 0, 1, 16, 'w');
      G.rect(15, 0, 1, 16, 'B'); G.rect(0, 15, 16, 1, 'B');
      G.rect(1, 1, 1, 1, 'k'); G.rect(14, 1, 1, 1, 'k'); G.rect(1, 14, 1, 1, 'k'); G.rect(14, 14, 1, 1, 'k');
      // estrela-do-mar gravada
      G.set(8, 3, 'B'); G.set(8, 4, 'B'); G.set(7, 5, 'B'); G.set(8, 5, 'B'); G.set(9, 5, 'B');
      G.line(4, 6, 7, 6, 'B'); G.line(9, 6, 12, 6, 'B');
      G.rect(7, 7, 3, 2, 'B');
      G.line(6, 9, 4, 12, 'B'); G.line(10, 9, 12, 12, 'B');
      if (t === T.ItemPower) { G.rect(6, 6, 5, 4, 'y'); G.rect(7, 6, 3, 1, 'w'); G.rect(6, 7, 1, 2, 'w'); G.rect(7, 7, 3, 2, 'T'); G.rect(7, 9, 3, 1, 'B'); G.rect(10, 7, 1, 2, 'B'); }
      return G;
    case T.Used:
      G.rect(0, 0, 16, 16, 'B');
      G.rect(0, 0, 16, 1, 'b'); G.rect(0, 0, 1, 16, 'b');
      G.rect(15, 0, 1, 16, 'k'); G.rect(0, 15, 16, 1, 'k');
      G.rect(1, 1, 1, 1, 'k'); G.rect(14, 1, 1, 1, 'k'); G.rect(1, 14, 1, 1, 'k'); G.rect(14, 14, 1, 1, 'k');
      return G;
    case T.Hidden:
      return null;
    case T.SlopeUp:
    case T.SlopeDown:
    case T.GentleUpLo:
    case T.GentleUpHi:
    case T.GentleDownHi:
    case T.GentleDownLo: {
      for (let x = 0; x < 16; x++) {
        const hL = slopeH(t, x), hR = slopeH(t, x + 1);
        const top = 16 - Math.max(hL, hR);
        for (let y = Math.max(0, Math.floor(top)); y < 16; y++) {
          const dy = y - top;
          G.set(x, y, dy < 1 ? 'T' : dy < 3 ? 't' : dy < 4 ? 'F' : 'f');
        }
      }
      for (let i = 0; i < 3; i++) {
        const h = hash(tx * 7 + i, ty * 13 + variant);
        if (G.get(h % 16, (h >> 4) % 16) === 'f') G.set(h % 16, (h >> 4) % 16, 'F');
      }
      return G;
    }
    case T.Spike:
      for (let i = 0; i < 4; i++) {
        const x = i * 4;
        G.line(x, 15, x + 2, 6, 'r'); G.line(x + 2, 6, x + 3, 15, 'R');
        G.rect(x, 15, 4, 1, 'R');
        G.set(x + 2, 6, 'w');
      }
      return G;
    case T.Water:
      G.rect(0, 0, 16, 16, 'a');
      for (let i = 0; i < 2; i++) {
        const h = hash(tx * 5 + i + anim, ty * 9);
        G.set(h % 16, (h >> 4) % 16, 'A');
      }
      return G;
    case T.WaterTop:
      G.rect(0, 2, 16, 14, 'a');
      for (let x = 0; x < 16; x++) {
        const y = 2 + Math.round(Math.sin((x + anim * 2 + tx * 4) / 2.5) * 1);
        G.set(x, y, 'w');
        G.set(x, y + 1, 'a');
        if (y > 2) G.set(x, 2, '.');
      }
      return G;
    case T.Rope:
      G.rect(7, 0, 2, 16, 'b');
      for (let y = 0; y < 16; y += 4) { G.rect(4, y + 1, 8, 1, 'B'); G.set(7, y + 2, 'B'); }
      return G;
    case T.Net:
      for (let i = 0; i < 16; i += 4) { G.rect(i, 0, 1, 16, 'b'); G.rect(0, i, 16, 1, 'b'); }
      for (let i = 0; i < 16; i += 4) G.set(i, i, 'B');
      return G;
    case T.Death:
      if (theme === 'forte' || theme === 'minas') {
        // lava/sal fervente
        G.rect(0, 0, 16, 16, 'y');
        for (let x = 0; x < 16; x++) { const y = Math.round(Math.sin((x + anim * 2) / 2.5) * 1) + 1; G.set(x, y, 'w'); G.set(x, 0, y === 0 ? 'w' : '.'); }
        for (let i = 0; i < 3; i++) { const h = hash(tx + i + anim, ty); G.set(h % 16, 4 + ((h >> 4) % 12), 'b'); }
      } else {
        // neblina maré letal
        G.rect(0, 0, 16, 16, 'r');
        for (let i = 0; i < 6; i++) { const h = hash(tx * 3 + i + anim, ty * 5); G.set(h % 16, (h >> 4) % 16, 'd'); }
        for (let x = 0; x < 16; x++) { const y = Math.round(Math.sin((x + anim * 2 + tx * 3) / 3) * 1.5) + 2; for (let yy = 0; yy < y; yy++) G.set(x, yy, '.'); }
      }
      return G;
    case T.WindUp:
      for (let i = 0; i < 3; i++) {
        const y = (15 - ((anim * 3 + i * 6) % 16));
        G.set(3 + i * 5, y, 'w'); G.set(3 + i * 5, y + 1, 'w');
      }
      return G;
    case T.Amber: {
      const fr = ['...kk...\n..kowk..\n.kooowk.\n.koooOk.\n.kOoOOk.\n..kOOk..\n...kk...', '...kk...\n..kwk...\n..kook..\n..kOok..\n..kOOk..\n..kOk...\n...kk...', '...kk...\n..kwok..\n.kwoook.\n.koOoOk.\n.kOOOOk.\n..kOOk..\n...kk...', '...kk...\n...kwk..\n..kook..\n..koOk..\n..kOOk..\n...kOk..\n...kk...'];
      const amberPal = fr[anim].replace(/k/g, 'K').replace(/o/g, 'o').replace(/O/g, 'O').replace(/w/g, 'w');
      G.blit(4, 4, amberPal);
      return G;
    }
    case T.Crumble:
      G.rect(0, 0, 16, 2, 'd');
      G.rect(0, 2, 16, 3, 'f');
      G.rect(0, 5, 16, 1, 'k');
      G.set(4, 2, 'k'); G.set(9, 3, 'k'); G.set(13, 2, 'k');
      return G;
    case T.Ice:
      G.rect(0, 0, 16, 16, 'w');
      G.rect(0, 0, 16, 16, 'a');
      G.rect(0, 0, 16, 2, 'w');
      G.line(3, 5, 8, 12, 'w'); G.line(10, 3, 13, 9, 'w');
      if (!down) G.rect(0, 15, 16, 1, 'A');
      return G;
    case T.Conveyor:
    case T.ConveyorL: {
      G.rect(0, 0, 16, 16, 'R');
      G.rect(0, 0, 16, 4, 'r');
      const dir = t === T.Conveyor ? 1 : -1;
      for (let x = 0; x < 16; x += 4) G.set((((x + anim * dir) % 16) + 16) % 16, 1, 'w');
      G.rect(0, 4, 16, 1, 'k');
      return G;
    }
    case T.Pillar:
      G.rect(5, 0, 6, 16, 'R');
      G.rect(6, 0, 1, 16, 'r');
      if (!up) G.rect(3, 0, 10, 2, 'r');
      return G;
    case T.Lamp:
      G.rect(7, 0, 2, 6, 'B');
      G.rect(5, 6, 6, 6, 'y');
      G.rect(6, 7, 4, 4, 'w');
      G.rect(5, 12, 6, 1, 'B');
      if (anim % 2) G.set(7, 8, 'y');
      return G;
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

/** Paleta estendida com cores do âmbar (K contorno, o/O laranja). */
for (const th of Object.values(THEMES)) {
  (th as Palette).K = '#6b3a0a';
  (th as Palette).o = '#ff9f2e';
  (th as Palette).O = '#e07a12';
}
