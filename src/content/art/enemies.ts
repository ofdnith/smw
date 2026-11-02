/**
 * Inimigos esculpidos em pixel art 16 bits. Desenho base olhando para a ESQUERDA
 * (o jogo espelha quando o inimigo anda para a direita). Mesmas dimensões dos sprites originais.
 */
import type { SpriteDef } from '../../engine/sprites';
import { Canvas, Materials } from '../../engine/pixelart';

type Draw = (c: Canvas, f: number) => void;

/** `post` desenha detalhes finos depois do contorno (fios, tentáculos) para não engrossá-los. */
function spr(w: number, h: number, mats: Materials, frames: number, fn: Draw, outline = true, post?: Draw): SpriteDef {
  const out: string[] = [];
  for (let f = 0; f < frames; f++) {
    const c = new Canvas(w, h, mats);
    fn(c, f);
    if (outline) c.outline();
    post?.(c, f);
    out.push(c.toString());
  }
  return { palette: mats.palette(), frames: out };
}

/** Olho redondo: branco com pupila olhando para a esquerda. */
function eye(c: Canvas, x: number, y: number, mat = 'eye', big = false): void {
  c.set(x, y, mat, 4).set(x + 1, y, mat, 3).set(x, y + 1, mat, 3).set(x + 1, y + 1, mat, 2);
  if (big) c.set(x, y + 2, mat, 2).set(x + 1, y + 2, mat, 1);
  c.ink(x, y + 1);
  if (big) c.ink(x, y + 2);
}

// ---------------------------------------------------------------- caranguejo-ermitão
const CRAB = new Materials({ shell: '#e8542e', belly: '#ffb27a', eye: '#ffffff', claw: '#ff7a3c', home: '#f7a8c4', spiral: '#c86a9a' });
const crab = spr(16, 12, CRAB, 2, (c, f) => {
  // patas
  const lp = f === 0 ? 0 : 1;
  for (const [x, d] of [[4, -1], [6, 0], [10, 0], [12, 1]] as [number, number][]) c.line(x, 8, x + d, 10 + ((x + lp) % 2), 'shell', 1);
  // corpo
  c.ellipse(8, 7, 5.5, 3.2, 'shell', 'sphere');
  c.rect(5, 8, 6, 1, 'belly', 'flat', 0, 1);
  // pinças erguidas
  const cy = f === 0 ? 3 : 2;
  c.circle(2.5, cy + 1, 1.9, 'claw', 'sphere');
  c.circle(13.5, cy + 2, 1.9, 'claw', 'sphere');
  c.ink(1, cy + 1);
  // olhos em hastes
  c.line(6, 4, 6, 2, 'shell', 1).line(9, 4, 9, 2, 'shell', 1);
  eye(c, 5, 1); eye(c, 8, 1);
});
const crabShell = spr(16, 10, CRAB, 4, (c) => {
  c.ellipse(8, 5, 6.5, 4.2, 'home', 'sphere');
  // espiral girando
  c.set(5, 3, 'home', 4).set(6, 2, 'home', 4);
}, true, (c, f) => {
  const a0 = (f / 4) * Math.PI * 2;
  for (let i = 0; i < 22; i++) {
    const a = a0 + i * 0.42, r = 0.4 + i * 0.2;
    c.set(8 + Math.cos(a) * r * 1.35, 5 + Math.sin(a) * r * 0.8, 'spiral', i > 16 ? 0 : 1);
  }
});

// ---------------------------------------------------------------- gaivota-ladra
const GULL = new Materials({ body: '#f4f6ff', wing: '#a9b4c8', beak: '#ffab2e', eye: '#ffffff' });
const gull = spr(16, 10, GULL, 2, (c, f) => {
  c.ellipse(8.5, 6, 4.5, 2.2, 'body', 'sphere');
  c.circle(4, 4.5, 2, 'body', 'sphere');
  c.poly([[0.5, 4.5], [2.5, 3.8], [2.5, 5.4]], 'beak', 'flat');
  c.ink(3, 4);
  c.poly([[12, 5], [15.5, 3.5], [15.5, 6.5]], 'wing', 'flat');
  if (f === 0) c.poly([[6, 5], [10, 5], [13, 0.5], [9, 2]], 'wing', 'vgrad');
  else c.poly([[6, 6], [10, 6], [13, 9.5], [9, 8.5]], 'wing', 'vgrad', -1);
  c.set(10, 8, 'beak', 1).set(8, 8, 'beak', 1);
});

// ---------------------------------------------------------------- ouriço-bomba
const URCHIN = new Materials({ body: '#5a3a8a', spike: '#2e1f4a', eye: '#ffffff', fuse: '#ffd24a', hot: '#ff4a3a' });
function urchinBody(c: Canvas, f: number, stun: boolean): void {
  const spikes = stun ? 0 : 10;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + (f ? 0.3 : 0);
    const x0 = 8 + Math.cos(a) * 4, y0 = 7 + Math.sin(a) * 3.6;
    const x1 = 8 + Math.cos(a) * 7, y1 = 7 + Math.sin(a) * 5.2;
    if (y1 < 11.5) c.line(x0, y0, x1, y1, 'spike', 2);
  }
  c.ellipse(8, 7, stun ? 5.5 : 4.8, stun ? 3.8 : 4, stun && f === 1 ? 'hot' : 'body', 'sphere');
  if (stun) {
    c.line(8, 3, 9, 1, 'spike', 1);
    c.set(9, 0, 'fuse', f ? 4 : 3);
    c.ink(5, 7).ink(6, 7).ink(10, 7).ink(11, 7);
  } else {
    eye(c, 5, 5); eye(c, 9, 5);
  }
}
const urchin = spr(16, 12, URCHIN, 2, (c, f) => urchinBody(c, f, false));
const urchinStun = spr(16, 12, URCHIN, 2, (c, f) => urchinBody(c, f, true));

// ---------------------------------------------------------------- lesma-musgo
const SLUG = new Materials({ body: '#8fd14a', moss: '#3f8a3a', eye: '#ffffff', flower: '#ff9ac8' });
const slug = spr(16, 10, SLUG, 2, (c, f) => {
  const s = f ? 0.6 : 0;
  c.ellipse(8.5, 7.2 + s * 0.5, 6.5 + s, 2.3 - s * 0.4, 'body', 'sphere');
  c.ellipse(4, 6, 2.6, 2.2, 'body', 'sphere');
  c.ellipse(9.5, 5, 4, 2.2, 'moss', 'sphere');
  c.set(11, 3, 'flower', 3).set(8, 3, 'moss', 3);
  c.line(3, 4, 2, 1, 'body', 1).line(5, 4, 5, 1, 'body', 1);
  c.set(2, 0, 'eye', 4).set(5, 0, 'eye', 4).ink(2, 1).ink(5, 1);
});

// ---------------------------------------------------------------- fantoche de névoa
const PUPPET = new Materials({ cloth: '#b9c4dc', dark: '#6a7aa0', button: '#2a2440', string: '#e8e8f8' });
const puppet = spr(16, 24, PUPPET, 2, (c, f) => {
  const sway = f ? 1 : 0;
  c.circle(8, 7, 4, 'cloth', 'sphere');
  c.poly([[4, 10], [12, 10], [14, 21], [11, 23], [8, 21.5], [5, 23], [2, 21]], 'cloth', 'sphere');
  c.line(4, 11, 2 + sway, 16, 'cloth', 1, 2).line(12, 11, 14 - sway, 16, 'cloth', 1, 2);
  c.set(6, 6, 'button', 2).set(10, 6, 'button', 2).set(6, 7, 'button', 1).set(10, 7, 'button', 1);
  c.set(5, 6, 'string', 4).set(9, 6, 'string', 4);
  c.line(6, 9, 10, 9, 'dark', 1);
  c.set(8, 14, 'button', 2).set(8, 17, 'button', 2);
}, true, (c, f) => {
  const sway = f ? 1 : 0;
  c.line(8, 0, 8, 2, 'string', 3).line(3, 0, 3 + sway, 14, 'string', 2).line(13, 0, 13 - sway, 14, 'string', 2);
});

// ---------------------------------------------------------------- polvo-cano
const OCT = new Materials({ body: '#b05ad8', spot: '#7a2fa8', eye: '#ffffff' });
const octopus = spr(16, 13, OCT, 2, (c, f) => {
  for (let i = 0; i < 4; i++) {
    const x = 3.5 + i * 3, w = f ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1);
    c.line(x, 8, x + w * 0.5, 10, 'body', 2, 2).set(x + w, 11, 'body', 1).set(x + w + 1, 11, 'body', 1);
  }
  c.ellipse(8, 5.5, 5.5, 4.5, 'body', 'sphere');
  c.set(10, 2, 'spot', 1).set(12, 4, 'spot', 1).set(11, 3, 'spot', 1);
  eye(c, 4, 4, 'eye', true); eye(c, 8, 4, 'eye', true);
  c.ellipse(3, 8, 1.4, 1, 'spot', 'flat');
});
const INK = new Materials({ ink: '#3a2a5a' });
const ink = spr(8, 6, INK, 2, (c, f) => {
  c.ellipse(4, 3, f ? 2.6 : 3, f ? 2 : 1.8, 'ink', 'sphere');
  c.set(f ? 6 : 1, f ? 1 : 4, 'ink', 3);
});

// ---------------------------------------------------------------- pipa-espinho
const KITE = new Materials({ red: '#e8423a', gold: '#ffd24a', spike: '#c9ccd6', cross: '#7a3a1a' });
const kite = spr(16, 16, KITE, 2, (c, f) => {
  c.poly([[8, 1], [14, 8], [8, 15], [2, 8]], 'red', 'sphere');
  c.poly([[8, 4], [11, 8], [8, 12], [5, 8]], 'gold', 'sphere');
  c.line(8, 2, 8, 14, 'cross', 1).line(3, 8, 13, 8, 'cross', 1);
  const s = f ? 1 : 0;
  c.set(8, 0 + s, 'spike', 4).set(15 - s, 8, 'spike', 3).set(8, 15 - s, 'spike', 2).set(1 + s, 8, 'spike', 3);
}, true);

// ---------------------------------------------------------------- água-viva-lâmpada
const JELLY = new Materials({ bell: '#6f86d8', glow: '#d8f4ff', tent: '#8fa0e0', core: '#fff6b0' });
function jellyBody(c: Canvas, f: number, lit: boolean): void {
  const m = lit ? 'glow' : 'bell';
  c.ellipse(8, 5.5, 6, 4.6, m, 'sphere');
  for (let x = 3; x <= 13; x++) c.clear(x, 10).clear(x, 9);
  c.rect(3, 8, 11, 1, m, 'flat', 0, -1);
  if (lit) c.circle(8, 5, 1.6, 'core', 'flat', 2);
  c.ink(6, 6).ink(10, 6);
}
function jellyTentacles(c: Canvas, f: number, lit: boolean): void {
  for (let i = 0; i < 5; i++) {
    const x = 4 + i * 2;
    for (let y = 10; y < 14; y++) c.set(x + (((y + i + f) >> 1) % 2), y, lit ? 'glow' : 'tent', lit ? 3 - (y > 12 ? 1 : 0) : 2 - (y > 12 ? 1 : 0));
  }
}
const jelly = spr(16, 14, JELLY, 2, (c, f) => jellyBody(c, f, false), true, (c, f) => jellyTentacles(c, f, false));
const jellyLit = spr(16, 14, JELLY, 2, (c, f) => jellyBody(c, f, true), true, (c, f) => jellyTentacles(c, f, true));

// ---------------------------------------------------------------- peixe-agulha
const FISH = new Materials({ body: '#4ab0e8', belly: '#d8f4ff', fin: '#2a6fb0', eye: '#ffffff' });
const fish = spr(16, 8, FISH, 2, (c, f) => {
  c.ellipse(8, 4, 5.5, 2.4, 'body', 'sphere');
  c.rect(4, 5, 7, 1, 'belly', 'flat', 0, 1);
  c.poly([[0.5, 4], [3, 3.2], [3, 4.8]], 'fin', 'flat');
  c.poly([[13, 4], [15.5, f ? 1 : 2], [15.5, f ? 7 : 6]], 'fin', 'vgrad');
  c.poly([[7, 2], [10, 0.5], [10, 2]], 'fin', 'flat');
  c.set(4, 3, 'eye', 4).ink(4, 4);
});

// ---------------------------------------------------------------- toupeira-mineira
const MOLE = new Materials({ fur: '#8a5a3a', snout: '#f2a0a0', helmet: '#f2c43a', lamp: '#fff6c0', claw: '#f0e0c8', dirt: '#7a5a3a' });
const mole = spr(16, 14, MOLE, 2, (c, f) => {
  c.ellipse(8, 9, 5.5, 4.5, 'fur', 'sphere');
  c.ellipse(8, 4.5, 5.4, 2.6, 'helmet', 'sphere');
  c.rect(2, 5, 12, 1, 'helmet', 'flat', 0, -1);
  c.circle(4.5, 3.5, 1.3, 'lamp', 'flat', 2);
  c.ellipse(5, 9, 2, 1.4, 'snout', 'sphere');
  c.ink(5, 7).ink(9, 7);
  const up = f ? -1 : 0;
  c.rect(1, 10 + up, 3, 2, 'claw', 'box').rect(12, 10 - up, 3, 2, 'claw', 'box');
  c.rect(6, 11, 2, 1, 'claw', 'flat', 0, 2);
});
const moleHole = spr(16, 6, MOLE, 1, (c) => {
  c.ellipse(8, 4, 7, 2.6, 'dirt', 'sphere');
  c.set(3, 2, 'dirt', 3).set(11, 1, 'dirt', 3).set(7, 1, 'dirt', 4);
});

// ---------------------------------------------------------------- morcego-fole
const BAT = new Materials({ body: '#8a5ad8', wing: '#5a3a9a', eye: '#ffe25a', fang: '#ffffff' });
function batFrame(w: number, h: number, f: number): (c: Canvas) => void {
  return (c) => {
    const cx = w / 2, cy = h / 2 + 1, r = Math.min(w, h) / 2 - 3.2;
    const up = f === 0;
    c.poly([[cx - r * 0.6, cy], [1, up ? 1.5 : cy + 2], [cx - r * 0.3, up ? cy - 1 : cy + r]], 'wing', 'vgrad');
    c.poly([[cx + r * 0.6, cy], [w - 1, up ? 1.5 : cy + 2], [cx + r * 0.3, up ? cy - 1 : cy + r]], 'wing', 'vgrad');
    c.circle(cx, cy, r, 'body', 'sphere');
    c.poly([[cx - r * 0.8, cy - r * 0.5], [cx - r * 0.5, cy - r - 2], [cx - r * 0.1, cy - r * 0.8]], 'body', 'flat');
    c.poly([[cx + r * 0.8, cy - r * 0.5], [cx + r * 0.5, cy - r - 2], [cx + r * 0.1, cy - r * 0.8]], 'body', 'flat');
    c.set(cx - r * 0.45, cy - 0.5, 'eye', 4).set(cx + r * 0.25, cy - 0.5, 'eye', 4);
    c.set(cx - 1, cy + r * 0.5, 'fang', 4).set(cx + 1, cy + r * 0.5, 'fang', 4);
  };
}
const bat = spr(14, 12, BAT, 2, (c, f) => batFrame(14, 12, f)(c));
const batMid = spr(16, 14, BAT, 2, (c, f) => batFrame(16, 14, f)(c));
const batBig = spr(20, 18, BAT, 2, (c, f) => batFrame(20, 18, f)(c));

// ---------------------------------------------------------------- marujo de bruma
const SAILOR = new Materials({ coat: '#3a5a9a', face: '#b8c8e0', cap: '#f0f0f8', oar: '#a8783a', belt: '#2a2a3a', boots: '#2a3050' });
const sailor = spr(16, 20, SAILOR, 2, (c, f) => {
  // remo (à frente, lado esquerdo)
  c.line(2, 4, 3, 18, 'oar', 2);
  c.rect(1, 14, 3, 5, 'oar', 'box');
  // pernas
  c.rect(5 + (f ? 0 : -1), 16, 3, 3, 'boots', 'box').rect(9 + (f ? 1 : 0), 16, 3, 3, 'boots', 'box');
  // casaco
  c.rect(4, 9, 9, 8, 'coat', 'sphere', 2);
  c.rect(4, 13, 9, 1, 'belt', 'flat');
  c.set(8, 11, 'cap', 3).set(8, 15, 'cap', 3);
  // cabeça
  c.ellipse(8, 6, 3.6, 3.2, 'face', 'sphere');
  c.ink(6, 6).ink(9, 6);
  c.rect(4, 2, 8, 2, 'cap', 'box', 1);
  c.rect(4, 3, 9, 1, 'belt', 'flat');
  // braço segurando o remo
  c.line(5, 10, 3, 12, 'coat', 1, 2);
});

// ---------------------------------------------------------------- chama de sal
const FLAME = new Materials({ outer: '#ff6a2a', mid: '#ffb02e', core: '#fff3b0' });
const flame = spr(12, 14, FLAME, 2, (c, f) => {
  const t = f ? 1 : -1;
  c.poly([[6 + t, 0.5], [10.5, 7], [10, 12], [6, 13.5], [2, 12], [1.5, 7]], 'outer', 'vgrad');
  c.poly([[6 - t, 4], [8.8, 8.5], [8, 12], [6, 12.8], [4, 12], [3.4, 8.5]], 'mid', 'vgrad');
  c.ellipse(6, 10.5, 1.6, 2, 'core', 'flat', 2);
}, false);

export const ENEMIES: Record<string, SpriteDef> = {
  crab, crabShell, gull, urchin, urchinStun, slug, puppet, octopus, ink, kite, jelly, jellyLit, fish, mole, moleHole, bat, batMid, batBig, sailor, flame,
};
