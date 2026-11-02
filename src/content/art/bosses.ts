/** Chefes esculpidos em 16 bits. Desenho base olhando para a ESQUERDA (a Sombra olha para a direita, como a Lumi). */
import type { SpriteDef, Palette } from '../../engine/sprites';
import { Canvas, Materials, OUTLINE_CHAR } from '../../engine/pixelart';
import { LUMI, LUMI_PALETTE } from './lumi';

type Draw = (c: Canvas, f: number) => void;
function spr(w: number, h: number, mats: Materials, frames: number, fn: Draw, post?: Draw): SpriteDef {
  const out: string[] = [];
  for (let f = 0; f < frames; f++) {
    const c = new Canvas(w, h, mats);
    fn(c, f);
    c.outline();
    post?.(c, f);
    out.push(c.toString());
  }
  return { palette: mats.palette(), frames: out };
}
const eyeL = (c: Canvas, x: number, y: number, angry = false): void => {
  c.set(x, y, 'eye', 4).set(x + 1, y, 'eye', 4).set(x, y + 1, 'eye', 3).set(x + 1, y + 1, 'eye', 3);
  c.ink(x, y + 1);
  if (angry) c.ink(x, y - 1).ink(x + 1, y);
};

// ---------------------------------------------------------------- Rei Siri (32x24)
const KC = new Materials({ shell: '#e0482a', belly: '#ffb48a', crown: '#ffd24a', eye: '#ffffff', claw: '#ff6a3a', gem: '#5ad0ff' });
function kingCrab(c: Canvas, legF: number, claw: 'down' | 'up' | 'stuck'): void {
  // patas
  for (let i = 0; i < 4; i++) {
    const x = 7 + i * 5, d = (i + legF) % 2 ? 1 : -1;
    c.line(x, 17, x + d * 2 - (i < 2 ? 2 : -2), 22, 'shell', 1, 2);
  }
  // pinça esquerda (pequena)
  c.circle(3.5, 12, 3, 'claw', 'sphere');
  c.ink(2, 12);
  // pinça direita (a grande, que crava)
  if (claw === 'down') c.circle(28, 15, 3.6, 'claw', 'sphere');
  if (claw === 'up') { c.line(25, 13, 28, 6, 'shell', 2, 3); c.circle(28.5, 4.5, 3.5, 'claw', 'sphere'); }
  if (claw === 'stuck') { c.line(25, 15, 28, 20, 'shell', 2, 3); c.poly([[25.5, 19], [31, 19], [29.5, 23.5], [27, 23.5]], 'claw', 'sphere'); }
  // corpo
  c.ellipse(16, 14, 11.5, 6.5, 'shell', 'sphere');
  c.ellipse(16, 16.5, 7, 2.6, 'belly', 'sphere');
  // coroa
  c.poly([[10, 8], [11, 3], [13, 6], [16, 2], [19, 6], [21, 3], [22, 8]], 'crown', 'vgrad');
  c.set(16, 6, 'gem', 3);
  eyeL(c, 11, 10, claw === 'stuck'); eyeL(c, 18, 10, claw === 'stuck');
}

// ---------------------------------------------------------------- Mãe-Musgo (32x18)
const MS = new Materials({ body: '#8fd14a', moss: '#3a8a3a', eye: '#ffffff', flower: '#ff8ac0', petal: '#ffe25a' });
function motherSlug(c: Canvas, f: number, floor: boolean): void {
  const sq = f ? 0.8 : 0;
  c.ellipse(16, 12 + sq * 0.5, 15 + sq, 5 - sq * 0.5, 'body', 'sphere');
  c.ellipse(6, 10, 5, 4.2, 'body', 'sphere');
  c.ellipse(19, 8, 10, 5, 'moss', 'sphere');
  for (const [x, y] of [[13, 5], [20, 4], [25, 7], [17, 8]] as [number, number][]) { c.set(x, y, 'flower', 3).set(x + 1, y, 'petal', 4); }
  c.line(4, 7, 2, 2, 'body', 1, 2).line(8, 7, 9, 2, 'body', 1, 2);
  if (floor) c.rect(1, 16, 30, 1, 'moss', 'flat', 0, -1);
}

// ---------------------------------------------------------------- Barão Cata-Vento (28x28)
const BR = new Materials({ wood: '#a8784a', sail: '#f0ecd8', hub: '#6a4a2e', eye: '#ffffff', iron: '#7a8090', angry: '#ff4a3a' });
function baron(c: Canvas, mode: number): void {
  const a0 = mode === 0 ? 0 : Math.PI / 4;
  for (let i = 0; i < 4; i++) {
    const a = a0 + (i * Math.PI) / 2, cs = Math.cos(a), sn = Math.sin(a);
    c.line(14 + cs * 3, 14 + sn * 3, 14 + cs * 12.5, 14 + sn * 12.5, 'wood', 1, 2);
    // vela (pano) de cada pá
    const px = -sn, py = cs;
    c.poly([[14 + cs * 5, 14 + sn * 5], [14 + cs * 12.5, 14 + sn * 12.5], [14 + cs * 12.5 + px * 3.5, 14 + sn * 12.5 + py * 3.5], [14 + cs * 5 + px * 3.5, 14 + sn * 5 + py * 3.5]], 'sail', 'flat', mode === 2 ? -1 : 0);
  }
  c.circle(14, 14, 5, 'hub', 'sphere');
  c.rect(12, 7, 4, 3, 'iron', 'box');
  if (mode === 2) { c.set(11, 13, 'angry', 3).set(16, 13, 'angry', 3); c.ink(11, 12).ink(17, 12); c.line(12, 17, 16, 16, 'iron', 0); }
  else { eyeL(c, 11, 12); eyeL(c, 15, 12); c.line(12, 17, 15, 17, 'iron', 1); }
}
const GUST = new Materials({ air: '#e8f4ff' });

// ---------------------------------------------------------------- Medusa-Maré (26x26)
const MD = new Materials({ bell: '#5a6ac8', glow: '#cfeeff', tent: '#7a8ad8', core: '#fff3a8', eye: '#ffffff' });
function medusa(c: Canvas, lit: boolean): void {
  const m = lit ? 'glow' : 'bell';
  c.ellipse(13, 9, 11.5, 8.2, m, 'sphere');
  for (let x = 1; x < 26; x++) for (let y = 15; y < 18; y++) c.clear(x, y);
  c.rect(2, 14, 22, 1, m, 'flat', 0, -1);
  for (let x = 3; x < 24; x += 3) c.set(x, 14, m, 3);
  if (lit) c.circle(13, 8, 3, 'core', 'flat', 2);
  eyeL(c, 8, 9); eyeL(c, 16, 9);
}
function medusaTent(c: Canvas, f: number, lit: boolean): void {
  for (let i = 0; i < 7; i++) {
    const x = 4 + i * 3;
    for (let y = 15; y < 26; y++) c.set(x + ((((y + i * 2 + f * 2) >> 2) % 2) ? 1 : 0), y, lit ? 'glow' : 'tent', y > 22 ? 1 : 2 + (lit ? 1 : 0));
  }
}

// ---------------------------------------------------------------- Velha Broca (28x22)
const DR = new Materials({ fur: '#7a4a2e', snout: '#f2a0a0', helmet: '#f2c43a', lamp: '#fff6c0', metal: '#8a90a0', drill: '#d8dce6', wheel: '#2a2a34', eye: '#ffffff', angry: '#ff4a3a' });
function drill(c: Canvas, f: number, dizzy: boolean): void {
  // broca à esquerda
  c.poly([[0.5, 15], [7, 11], [7, 19]], 'drill', 'vgrad');
  for (let i = 0; i < 3; i++) c.line(2 + i * 2 + f, 13 + i, 2 + i * 2 + f, 17 - i, 'drill', 1);
  // máquina
  c.rect(6, 12, 20, 7, 'metal', 'box', 2);
  c.rect(24, 13, 3, 3, 'metal', 'box');
  c.circle(10, 19.5, 2.4, 'wheel', 'sphere'); c.circle(21, 19.5, 2.4, 'wheel', 'sphere');
  c.set(10 + (f ? 1 : -1), 19, 'metal', 3).set(21 + (f ? -1 : 1), 19, 'metal', 3);
  // toupeira na cabine
  c.ellipse(16, 8.5, 5.5, 4.5, 'fur', 'sphere');
  c.ellipse(16, 3.8, 5.6, 2.5, 'helmet', 'sphere');
  c.circle(12.5, 3, 1.3, 'lamp', 'flat', 2);
  c.ellipse(13, 9.5, 1.8, 1.3, 'snout', 'sphere');
  if (dizzy) { c.set(13, 7, 'angry', 3).set(18, 7, 'angry', 3); c.ink(14, 7).ink(17, 7); }
  else { c.ink(13, 7).ink(17, 7); }
}

// ---------------------------------------------------------------- Capitão Brumo (18x30)
const BM = new Materials({ coat: '#2f4a8a', fog: '#c8d4ec', cap: '#1a2440', gold: '#ffd24a', pipe: '#8a5a2e', eye: '#ffb03a', stun: '#9ab0d8' });
function brumo(c: Canvas, f: number, mode: 'walk' | 'dash' | 'stun'): void {
  // névoa saindo do casaco
  c.ellipse(9, 9, 4.2, 4.6, 'fog', 'sphere', mode === 'stun' ? 1 : 0);
  // casaco vazio (comprido)
  c.poly([[3, 12], [15, 12], [16.5, 27], [1.5, 27]], 'coat', 'sphere');
  c.line(9, 13, 9, 26, 'coat', 0);
  for (const y of [15, 19, 23]) { c.set(7, y, 'gold', 3); c.set(11, y, 'gold', 3); }
  c.rect(2, 12, 3, 2, 'gold', 'box').rect(13, 12, 3, 2, 'gold', 'box');
  // pernas de névoa
  c.rect(5 + (f ? -1 : 0), 27, 3, 2, 'fog', 'box').rect(10 + (f ? 1 : 0), 27, 3, 2, 'fog', 'box');
  // braço
  if (mode === 'dash') c.line(3, 14, 0, 17, 'coat', 1, 2);
  else c.line(3, 14, 2, 21, 'coat', 1, 2);
  // quepe
  c.rect(3, 3, 12, 3, 'cap', 'box', 1);
  c.rect(2, 5, 9, 1, 'cap', 'flat', 0, -1);
  c.set(9, 4, 'gold', 4);
}
function brumoPost(c: Canvas, f: number, mode: 'walk' | 'dash' | 'stun'): void {
  // olhos e cachimbo: as únicas partes sólidas
  if (mode === 'stun') { c.set(6, 8, 'stun', 3).set(9, 8, 'stun', 3); }
  else { c.set(6, 8, 'eye', 4).set(7, 8, 'eye', 3).set(10, 8, 'eye', 4).set(11, 8, 'eye', 3); }
  c.line(5, 11, 2, 11, 'pipe', 2).set(1, 10, 'pipe', 3).set(1, 11, 'pipe', 1);
  if (f) c.set(1, 8, 'fog', 4).set(2, 7, 'fog', 3);
  else c.set(2, 8, 'fog', 4).set(1, 6, 'fog', 3);
}

// ---------------------------------------------------------------- projéteis
const MISC = new Materials({ iron: '#5a6070', salt: '#f0ecdc' });

// ---------------------------------------------------------------- Sombra de Lumi: Lumi com paleta de breu e contorno vermelho
function shadowPalette(): Palette {
  const p: Palette = {};
  for (const [k, v] of Object.entries(LUMI_PALETTE)) {
    if (!v) { p[k] = null; continue; }
    const n = parseInt(v.slice(1), 16), lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
    const t = lum / 255;
    const r = Math.round(14 + t * 52), g = Math.round(8 + t * 26), b = Math.round(28 + t * 70);
    p[k] = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  p[OUTLINE_CHAR] = '#e8306a';
  return p;
}

export const BOSSES: Record<string, SpriteDef> = {
  kingcrab: spr(32, 24, KC, 2, (c, f) => kingCrab(c, f, 'down')),
  kingcrabRaise: spr(32, 24, KC, 1, (c) => kingCrab(c, 0, 'up')),
  kingcrabStuck: spr(32, 24, KC, 1, (c) => kingCrab(c, 1, 'stuck')),
  motherslug: spr(32, 18, MS, 2, (c, f) => motherSlug(c, f, false), (c) => { c.set(2, 1, 'eye', 4).set(9, 1, 'eye', 4).ink(2, 2).ink(9, 2); }),
  motherslugFloor: spr(32, 18, MS, 2, (c, f) => motherSlug(c, f, true), (c) => { c.set(2, 1, 'eye', 4).set(9, 1, 'eye', 4).ink(2, 2).ink(9, 2); }),
  baron: spr(28, 28, BR, 3, (c, f) => baron(c, f)),
  gust: spr(16, 9, GUST, 2, () => undefined, (c, f) => {
    for (let i = 0; i < 3; i++) { const y = 2 + i * 2.5; c.line(1 + i + f, y, 13 - i + f, y, 'air', 4 - i); c.set(14 - i + f, y - 1, 'air', 3); }
  }),
  medusa: spr(26, 26, MD, 2, (c) => medusa(c, false), (c, f) => medusaTent(c, f, false)),
  medusaLit: spr(26, 26, MD, 2, (c) => medusa(c, true), (c, f) => medusaTent(c, f, true)),
  drill: spr(28, 22, DR, 2, (c, f) => drill(c, f, false)),
  drillDizzy: spr(28, 22, DR, 2, (c, f) => drill(c, f, true)),
  shadow: { palette: shadowPalette(), frames: [LUMI.walk[0], LUMI.walk[2]] },
  brumo: spr(18, 30, BM, 2, (c, f) => brumo(c, f, 'walk'), (c, f) => brumoPost(c, f, 'walk')),
  brumoDash: spr(18, 30, BM, 2, (c, f) => brumo(c, f, 'dash'), (c, f) => brumoPost(c, f, 'dash')),
  brumoStun: spr(18, 30, BM, 2, (c, f) => brumo(c, f, 'stun'), (c, f) => brumoPost(c, f, 'stun')),
  cannonball: spr(10, 10, MISC, 1, (c) => { c.circle(5, 5, 3.8, 'iron', 'sphere'); }),
  stalactite: spr(10, 16, MISC, 1, (c) => { c.poly([[1, 0.5], [9, 0.5], [5, 15]], 'salt', 'cyl'); c.line(4, 2, 5, 11, 'salt', 4); }),
};
