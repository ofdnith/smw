/**
 * Fundos com parallax por ambientação. Cada camada é uma faixa de pixel art esculpida uma vez
 * (morros, árvores, montanhas, nuvens, cristais...) e repetida horizontalmente.
 * Céus em faixas de cor, como nos fundos de 16 bits.
 */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import type { Theme } from '../level/format';
import { Canvas, Materials } from '../../engine/pixelart';
import { compileFrame, type Frame } from '../../engine/sprites';
import { LIGHTHOUSE } from '../../content/art/npcs';
import { getSprite } from '../../engine/sprites';

function h(x: number, y = 0): number {
  let v = (x * 374761393 + y * 668265263) | 0;
  v = (v ^ (v >> 13)) * 1274126177;
  return ((v ^ (v >> 16)) >>> 0) / 4294967296;
}

export interface BgOpts {
  dark?: boolean;
  night?: boolean;
  /** sala submersa (recife): fundo subaquático */
  underwater?: boolean;
  frame: number;
}

// ------------------------------------------------------------------ faixas esculpidas (cache)

const W = 256;
type Strip = Frame & { bottom: string | null };
const cache = new Map<string, Strip>();
function strip(key: string, w: number, hgt: number, mats: Materials, draw: (c: Canvas) => void, outline = true): Strip {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = new Canvas(w, hgt, mats);
  draw(c);
  if (outline) c.outline();
  const pal = mats.palette();
  const p = c.get(Math.floor(w / 2), hgt - 1);
  const bottom = p ? (p.m < 0 ? mats.outline : mats.list[p.m].ramp[p.t]) : null;
  const f: Strip = { ...compileFrame(c.toString(), pal), bottom };
  void pal;
  cache.set(key, f);
  return f;
}
/** Repete a faixa na horizontal com deslocamento de parallax; `fill` pinta da base da faixa até o pé da tela. */
function tileX(r: Renderer, f: Strip, camX: number, speed: number, y: number, drift = 0, fill = false): void {
  const off = (((camX * speed + drift) % f.w) + f.w) % f.w;
  for (let x = -off; x < VIEW_W; x += f.w) r.ctx.drawImage(f.img, Math.round(x), Math.round(y));
  if (fill && f.bottom && y + f.h < VIEW_H) r.fillRect(0, Math.round(y) + f.h, VIEW_W, VIEW_H, f.bottom);
}
/** Céu em faixas de cor (sem degradê suave, como no hardware de 16 bits). */
function bands(r: Renderer, colors: string[], y0 = 0, y1 = VIEW_H): void {
  const n = colors.length, hh = (y1 - y0) / n;
  colors.forEach((c, i) => r.fillRect(0, y0 + Math.floor(i * hh), VIEW_W, Math.ceil(hh) + 1, c));
}
/** Desenha uma forma também deslocada de ±W para a faixa emendar sem costura. */
function wrap(fn: (dx: number) => void): void {
  fn(0); fn(-W); fn(W);
}

// morros arredondados com volume
function hillsStrip(key: string, hgt: number, base: string, top: string | null, count: number, seed: number, minR: number, maxR: number, squash = 1): Strip {
  const mats = new Materials(top ? { hill: base, cap: top } : { hill: base });
  return strip(key, W, hgt, mats, (c) => {
    for (let i = 0; i < count; i++) {
      const x = (i + h(i, seed) * 0.6) * (W / count);
      const rr = minR + h(i, seed + 1) * (maxR - minR);
      const ry = rr * (0.8 + h(i, seed + 2) * 0.5) * squash;
      wrap((dx) => c.ellipse(x + dx, hgt - 1 + ry * 0.15, rr, ry, 'hill', 'sphere'));
    }
    c.rect(0, hgt - 3, W, 3, 'hill', 'flat', 0, -1);
    if (top) for (let x = 0; x < W; x++) for (let y = 0; y < hgt; y++) {
      const p = c.get(x, y);
      if (p && !c.get(x, y - 1)) { c.set(x, y, 'cap', 3); c.set(x, y + 1, 'cap', 2); if (h(x, seed) > 0.5) c.set(x, y + 2, 'cap', 1); }
    }
  });
}
// montanhas pontudas com neve
function mountainsStrip(key: string, hgt: number, rock: string, snow: string, count: number, seed: number): Strip {
  const mats = new Materials({ rock, snow });
  return strip(key, W, hgt, mats, (c) => {
    for (let i = 0; i < count; i++) {
      const x = (i + h(i, seed) * 0.5) * (W / count), peak = 6 + h(i, seed + 1) * (hgt * 0.45), half = 22 + h(i, seed + 2) * 26;
      wrap((dx) => {
        c.poly([[x + dx - half, hgt], [x + dx, peak], [x + dx + half, hgt]], 'rock', 'vgrad');
        // face iluminada (esquerda) e neve no pico
        c.poly([[x + dx - half * 0.55, hgt], [x + dx, peak], [x + dx - 2, hgt]], 'rock', 'flat', 1);
        c.poly([[x + dx - half * 0.28, peak + (hgt - peak) * 0.28], [x + dx, peak], [x + dx + half * 0.28, peak + (hgt - peak) * 0.28], [x + dx + 3, peak + (hgt - peak) * 0.2], [x + dx - 2, peak + (hgt - peak) * 0.3]], 'snow', 'flat', 1);
      });
    }
  });
}
// floresta de copas redondas
function forestStrip(key: string, hgt: number, leaf: string, trunk: string, count: number, seed: number, rMin: number, rMax: number): Strip {
  const mats = new Materials({ leaf, trunk });
  return strip(key, W, hgt, mats, (c) => {
    for (let i = 0; i < count; i++) {
      const x = (i + h(i, seed) * 0.7) * (W / count), rr = rMin + h(i, seed + 1) * (rMax - rMin);
      const cy = hgt - rr * 1.3 - h(i, seed + 3) * 8;
      wrap((dx) => {
        c.rect(Math.round(x + dx - 2), Math.round(cy), 4, hgt, 'trunk', 'cyl');
        c.circle(x + dx, cy, rr, 'leaf', 'sphere');
        c.circle(x + dx - rr * 0.6, cy + rr * 0.4, rr * 0.7, 'leaf', 'sphere');
        c.circle(x + dx + rr * 0.6, cy + rr * 0.45, rr * 0.65, 'leaf', 'sphere');
      });
    }
    c.rect(0, hgt - 6, W, 6, 'leaf', 'flat', 0, -1);
  });
}
// nuvem fofa
function cloud(key: string, w: number, hgt: number, color: string, seed: number): Strip {
  const mats = new Materials({ cloud: color }, '#6f86b8');
  return strip(key, w, hgt, mats, (c) => {
    const n = Math.max(3, Math.floor(w / 10));
    for (let i = 0; i < n; i++) {
      const x = 5 + (i / (n - 1)) * (w - 10), rr = 4 + h(i, seed) * (hgt * 0.38);
      c.circle(x, hgt - rr - 1, rr, 'cloud', 'sphere', 1);
    }
    c.rect(4, hgt - 5, w - 8, 4, 'cloud', 'flat', 0, 1);
  });
}
function cloudLayer(r: Renderer, camX: number, speed: number, y0: number, color: string, f: number, seed: number, n = 5): void {
  for (let i = 0; i < n; i++) {
    const w = 32 + Math.floor(h(i, seed) * 4) * 8, hgt = 14 + Math.floor(h(i, seed + 1) * 3) * 3;
    const cf = cloud(`cloud:${color}:${w}:${hgt}:${seed + i}`, w, hgt, color, seed + i);
    const span = VIEW_W + 120;
    const x = ((i * 97 + h(i, seed + 2) * 60 - camX * speed + f * 0.08) % span + span) % span - 60;
    r.ctx.drawImage(cf.img, Math.round(x), Math.round(y0 + h(i, seed + 3) * 34));
  }
}
// palmeira
function palm(): Strip {
  const mats = new Materials({ trunk: '#b8864a', leaf: '#3fb05a', coco: '#7a4a2a' });
  return strip('palm', 30, 40, mats, (c) => {
    for (let y = 12; y < 40; y++) { const x = 15 + Math.sin(y / 9) * 3; c.set(x, y, 'trunk', (y % 3 === 0) ? 1 : 3); c.set(x + 1, y, 'trunk', 2); }
    for (const [ex, ey] of [[2, 14], [6, 6], [15, 3], [24, 6], [28, 14]] as [number, number][]) c.line(15, 10, ex, ey, 'leaf', 2, 2);
    for (const [ex, ey] of [[4, 11], [26, 11]] as [number, number][]) c.line(15, 10, ex, ey, 'leaf', 3, 2);
    c.circle(14, 11, 1.4, 'coco', 'sphere'); c.circle(17, 11, 1.4, 'coco', 'sphere');
  });
}
function sun(r: Renderer, x: number, y: number, core: string, glow: string): void {
  r.ctx.globalAlpha = 0.25; r.circle(x, y, 20, glow, false); r.ctx.globalAlpha = 0.45; r.circle(x, y, 16, glow, false); r.ctx.globalAlpha = 1;
  r.circle(x, y, 12, core, false); r.circle(x - 3, y - 3, 6, '#ffffff', false);
}
function sea(r: Renderer, camX: number, y: number, colors: string[], foam: string, f: number): void {
  bands(r, colors, y, VIEW_H);
  for (let i = 0; i < 16; i++) {
    const x = ((i * 37 - camX * 0.25 + f * 0.3) % (VIEW_W + 40)) - 20;
    r.fillRect(x, y + 3 + (i % 4) * 7, 8 + (i % 3) * 4, 1, foam);
  }
}
function stars(r: Renderer, camX: number, f: number, n: number, maxY = 120): void {
  for (let i = 0; i < n; i++) {
    const x = ((i * 83 + h(i, 31) * 50 - camX * 0.05) % VIEW_W + VIEW_W) % VIEW_W;
    const y = h(i, 32) * maxY;
    const tw = (f + i * 13) % 90 < 8;
    r.fillRect(x, y, 1, 1, tw ? '#ffffff' : h(i, 33) > 0.5 ? '#c8d8ff' : '#8a9ad8');
    if (tw) { r.fillRect(x - 1, y, 3, 1, 'rgba(255,255,255,0.6)'); r.fillRect(x, y - 1, 1, 3, 'rgba(255,255,255,0.6)'); }
  }
}

// ------------------------------------------------------------------ fundos por tema

export function drawBackground(r: Renderer, theme: Theme, camX: number, camY: number, o: BgOpts): void {
  const f = o.frame;
  const ctx = r.ctx;
  switch (theme) {
    case 'praia': {
      bands(r, ['#4ab8ff', '#5cc2ff', '#70ccff', '#86d6ff', '#9ee0ff', '#b8eaff', '#d4f2ff'], 0, 120);
      sun(r, 262, 34, '#fff3a0', '#fff8d0');
      cloudLayer(r, camX, 0.12, 10, '#ffffff', f, 1);
      const seaY = Math.round(108 - camY * 0.1);
      sea(r, camX, seaY, ['#2f9fe0', '#2a8fd0', '#2580c0'], '#d4f2ff', f);
      tileX(r, hillsStrip('praia:far', 24, '#5aa8c8', '#8ad0e0', 3, 7, 34, 50, 0.32), camX, 0.2, seaY - 22);
      tileX(r, hillsStrip('praia:dunes', 40, '#f0d49a', '#fff0c4', 5, 3, 26, 40, 0.55), camX, 0.4, Math.round(140 - camY * 0.3) - 40, 0, true);
      const pf = palm();
      for (let i = 0; i < 4; i++) {
        const span = VIEW_W + 80, x = ((i * 120 + h(i, 7) * 50 - camX * 0.55) % span + span) % span - 40;
        ctx.drawImage(pf.img, Math.round(x), Math.round(118 - camY * 0.45));
      }
      break;
    }
    case 'bosque': {
      bands(r, ['#8ec8a0', '#9ad0aa', '#a6d8b2', '#b4e0bc', '#c4e8c6', '#d4eed0']);
      cloudLayer(r, camX, 0.08, 6, '#eef8ea', f, 2, 4);
      tileX(r, mountainsStrip('bosque:mtn', 70, '#7aa898', '#c8e8d8', 4, 11), camX, 0.12, Math.round(40 - camY * 0.1));
      tileX(r, forestStrip('bosque:far', 90, '#4a9a6a', '#3a5a3a', 9, 5, 9, 14), camX, 0.3, Math.round(38 - camY * 0.2));
      tileX(r, forestStrip('bosque:near', 80, '#2f7a4a', '#4a3424', 6, 9, 13, 19), camX, 0.55, Math.round(62 - camY * 0.4), 0, true);
      for (let i = 0; i < 30; i++) {
        const x = (((i * 53 + h(i) * 40 - camX * 0.8) % VIEW_W) + VIEW_W) % VIEW_W;
        const y = (f * 4 + i * 71) % VIEW_H;
        r.fillRect(x, y, 1, 4, 'rgba(230,245,255,0.45)');
      }
      break;
    }
    case 'penhasco': {
      bands(r, ['#5ab0f0', '#68b8f2', '#78c2f4', '#8acbf6', '#9ed6f8', '#b6e2fa', '#d0eefc']);
      cloudLayer(r, camX, 0.15, 14, '#ffffff', f, 3);
      tileX(r, mountainsStrip('penhasco:mtn', 90, '#8a98b8', '#f4f8ff', 4, 21), camX, 0.15, Math.round(30 - camY * 0.15));
      cloudLayer(r, camX, 0.3, 80, '#f4faff', f + 300, 4, 4);
      tileX(r, hillsStrip('penhasco:hills', 50, '#6a9a6a', '#9ad87a', 4, 13, 28, 44, 0.6), camX, 0.45, Math.round(90 - camY * 0.35), 0, true);
      // moinhos
      for (let i = 0; i < 2; i++) {
        const span = VIEW_W + 120, x = ((i * 200 + 90 - camX * 0.45) % span + span) % span - 60, y = Math.round(124 - camY * 0.35);
        r.fillRect(x - 4, y - 26, 8, 28, '#e8e0d0'); r.fillRect(x + 1, y - 26, 3, 28, '#c8bca8'); r.fillRect(x - 5, y - 30, 10, 5, '#a8784a');
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        for (let k = 0; k < 4; k++) { const a = f / 80 + (k * Math.PI) / 2; ctx.beginPath(); ctx.moveTo(x, y - 27); ctx.lineTo(x + Math.cos(a) * 15, y - 27 + Math.sin(a) * 15); ctx.stroke(); }
      }
      break;
    }
    case 'recife': {
      if (!o.underwater) {
        bands(r, ['#5a9ae8', '#7aa8e8', '#a0b4e4', '#c8bce0', '#ecc4d8', '#ffd0d4', '#ffe0cc'], 0, 120);
        sun(r, 70, 44, '#fff0a0', '#ffd8b0');
        cloudLayer(r, camX, 0.12, 12, '#fff4f4', f, 5);
        const seaY = Math.round(112 - camY * 0.1);
        sea(r, camX, seaY, ['#3a8fd0', '#2f80c4', '#2670b6'], '#ffe8f0', f);
        tileX(r, hillsStrip('recife:dunes', 40, '#f4cc90', '#ffe4b8', 5, 31, 26, 40, 0.5), camX, 0.4, Math.round(140 - camY * 0.3) - 40, 0, true);
        tileX(r, coralStrip(), camX, 0.6, Math.round(96 - camY * 0.5), 0, true);
        break;
      }
      bands(r, ['#2f9ad8', '#2a8acc', '#257ac0', '#206ab2', '#1c5aa2', '#184a90', '#143c7c']);
      for (let i = 0; i < 5; i++) {
        const x = ((i * 90 - camX * 0.2) % (VIEW_W + 60)) - 30;
        ctx.globalAlpha = 0.08; ctx.fillStyle = '#ffffff'; ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x + 26, 0); ctx.lineTo(x + 60 + Math.sin(f / 60 + i) * 6, VIEW_H); ctx.lineTo(x + 12, VIEW_H); ctx.fill();
        ctx.globalAlpha = 1;
      }
      tileX(r, kelpStrip(), camX, 0.3, Math.round(70 - camY * 0.2), Math.sin(f / 50) * 2);
      tileX(r, coralStrip(), camX, 0.5, Math.round(80 - camY * 0.3));
      for (let i = 0; i < 14; i++) {
        const x = ((i * 47 + Math.sin((f + i * 20) / 40) * 6 - camX * 0.5) % VIEW_W + VIEW_W) % VIEW_W;
        const y = VIEW_H - ((f * 0.6 + i * 50) % (VIEW_H + 20));
        r.fillRect(x, y, 2, 2, 'rgba(220,240,255,0.55)'); r.fillRect(x, y, 1, 1, 'rgba(255,255,255,0.9)');
      }
      break;
    }
    case 'minas': {
      bands(r, ['#2a2836', '#302e3e', '#363446', '#3e3c50', '#46445a', '#504e64']);
      tileX(r, crystalStrip('minas:far', 110, '#7a8aa8', 14, 41), camX, 0.25, Math.round(24 - camY * 0.2));
      tileX(r, stalactiteStrip(), camX, 0.4, Math.round(-camY * 0.3));
      tileX(r, crystalStrip('minas:near', 80, '#d8e4f4', 9, 43), camX, 0.55, Math.round(60 - camY * 0.4), 0, true);
      break;
    }
    case 'vale': {
      bands(r, ['#04050c', '#070912', '#0a0d1a', '#0d1222', '#10162a', '#141a32']);
      stars(r, camX, f, 50);
      ctx.globalAlpha = 0.07; r.circle(250, 32, 18, '#ffffff', false); ctx.globalAlpha = 1;
      tileX(r, mountainsStrip('vale:mtn', 80, '#1a2236', '#2a3450', 4, 51), camX, 0.12, Math.round(34 - camY * 0.1));
      tileX(r, forestStrip('vale:far', 90, '#16283a', '#0e1620', 9, 53, 9, 14), camX, 0.3, Math.round(38 - camY * 0.2));
      tileX(r, forestStrip('vale:near', 80, '#0e1a26', '#080c12', 6, 57, 13, 19), camX, 0.55, Math.round(62 - camY * 0.4), 0, true);
      for (let i = 0; i < 16; i++) {
        const x = ((i * 59 + Math.sin((f + i * 30) / 50) * 10 - camX * 0.7) % VIEW_W + VIEW_W) % VIEW_W;
        const y = 60 + h(i, 3) * 100 + Math.sin((f + i * 17) / 37) * 6;
        const a = 0.4 + 0.6 * Math.abs(Math.sin((f + i * 23) / 30));
        r.fillRect(x - 1, y - 1, 4, 4, `rgba(200,255,150,${(a * 0.25).toFixed(2)})`);
        r.fillRect(x, y, 2, 2, `rgba(220,255,170,${a.toFixed(2)})`);
      }
      break;
    }
    case 'farol':
    case 'navio': {
      bands(r, ['#141c34', '#1a2440', '#22304e', '#2a3a5c', '#34466a', '#3e5278', '#4a5e86']);
      stars(r, camX, f, 25, 80);
      cloudLayer(r, camX, 0.12, 14, '#4a5a80', f, 6, 4);
      const seaY = Math.round(120 - camY * 0.15);
      // farol mestre ao longe
      const lh = getSprite(LIGHTHOUSE, false).frames[(f % 120) < 60 ? 1 : 0];
      const lx = 236 - camX * 0.06;
      ctx.globalAlpha = 0.8; ctx.drawImage(lh.img, Math.round(lx), seaY - 32, 12, 32); ctx.globalAlpha = 1;
      if ((f % 120) < 60) {
        ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff4b0'; ctx.beginPath();
        const a = f / 40, bx = lx + 6, by = seaY - 29;
        ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * 300, by + Math.sin(a) * 60 - 20); ctx.lineTo(bx + Math.cos(a) * 300, by + Math.sin(a) * 60 + 20); ctx.fill(); ctx.globalAlpha = 1;
      }
      sea(r, camX, seaY, ['#1f3a5f', '#1a3254', '#162a48'], '#6f829c', f);
      for (let i = 0; i < 8; i++) {
        const x = ((i * 47 - camX * 0.4 + f * 0.6) % (VIEW_W + 40)) - 20, y = seaY + 4 + (i % 3) * 10 + Math.sin((f + i * 10) / 20) * 2;
        r.fillRect(x, y, 6, 2, '#a8b8d0');
      }
      break;
    }
    case 'ceu': {
      bands(r, ['#140c40', '#22164e', '#32205e', '#4a2e72', '#6a3e82', '#9a5088', '#ce6a88', '#f2908a']);
      stars(r, camX, f, 60, 100);
      tileX(r, hillsStrip('ceu:clouds1', 50, '#e8b8d8', '#ffe0f0', 6, 61, 16, 26), camX, 0.25, Math.round(108 - camY * 0.25));
      tileX(r, hillsStrip('ceu:clouds2', 46, '#f4f0ff', '#ffffff', 5, 63, 18, 28), camX, 0.45, Math.round(138 - camY * 0.45), 0, true);
      break;
    }
    case 'forte': {
      bands(r, ['#140c1a', '#180f20', '#1c1226', '#20152c']);
      tileX(r, castleWallStrip(), camX, 0.35, Math.round(-camY * 0.25));
      for (let i = 0; i < 6; i++) {
        const span = VIEW_W + 60, x = ((i * 77 - camX * 0.5) % span + span) % span - 30;
        for (let y = 0; y < VIEW_H; y += 6) { r.fillRect(x + ((y / 6) % 2) * 2, y - camY * 0.4, 3, 4, '#3a2e48'); r.fillRect(x + ((y / 6) % 2) * 2, y - camY * 0.4, 1, 4, '#54466a'); }
      }
      break;
    }
  }
  if (o.night) r.dim(0.35, '#0a1030');
}

// ------------------------------------------------------------------ faixas especiais

function coralStrip(): Strip {
  const mats = new Materials({ pink: '#f48ab8', gold: '#f2c070', mint: '#7ad8b0', sand: '#e8b880' });
  return strip('recife:coral', W, 60, mats, (c) => {
    c.rect(0, 50, W, 10, 'sand', 'vgrad');
    for (let i = 0; i < 12; i++) {
      const x = (i + h(i, 71) * 0.6) * (W / 12), hh = 10 + h(i, 72) * 18, m = ['pink', 'gold', 'mint'][i % 3];
      wrap((dx) => {
        c.line(x + dx, 52, x + dx, 52 - hh, m, 2, 3);
        c.line(x + dx, 52 - hh * 0.5, x + dx - 7, 52 - hh * 0.8, m, 2, 2);
        c.line(x + dx, 52 - hh * 0.4, x + dx + 6, 52 - hh * 0.75, m, 3, 2);
        c.circle(x + dx, 52 - hh, 2.4, m, 'sphere');
      });
    }
  });
}
function kelpStrip(): Strip {
  const mats = new Materials({ kelp: '#2a8a6a' }, '#103a4a');
  return strip('recife:kelp', W, 110, mats, (c) => {
    for (let i = 0; i < 9; i++) {
      const x0 = (i + h(i, 81)) * (W / 9), top = 10 + h(i, 82) * 40;
      wrap((dx) => {
        for (let y = top; y < 110; y++) c.set(x0 + dx + Math.sin(y / 7 + i) * 2, y, 'kelp', 2).set(x0 + dx + 1 + Math.sin(y / 7 + i) * 2, y, 'kelp', 1);
        for (let y = top + 6; y < 110; y += 10) c.ellipse(x0 + dx + 3 + Math.sin(y / 7 + i) * 2, y, 2.2, 1.2, 'kelp', 'sphere');
      });
    }
  });
}
function crystalStrip(key: string, hgt: number, color: string, count: number, seed: number): Strip {
  const mats = new Materials({ crystal: color, rock: '#3a3848' });
  return strip(key, W, hgt, mats, (c) => {
    c.rect(0, hgt - 10, W, 10, 'rock', 'vgrad');
    for (let i = 0; i < count; i++) {
      const x = (i + h(i, seed) * 0.7) * (W / count), hh = hgt * (0.3 + h(i, seed + 1) * 0.6), w = 4 + h(i, seed + 2) * 6;
      const lean = (h(i, seed + 3) - 0.5) * 10;
      wrap((dx) => {
        c.poly([[x + dx - w / 2, hgt - 8], [x + dx + lean - w / 3, hgt - 8 - hh], [x + dx + lean, hgt - 12 - hh], [x + dx + lean + w / 3, hgt - 8 - hh], [x + dx + w / 2, hgt - 8]], 'crystal', 'cyl');
        c.poly([[x + dx + 4, hgt - 8], [x + dx + 4 + lean * 0.5, hgt - 8 - hh * 0.5], [x + dx + 7 + lean * 0.5, hgt - 10 - hh * 0.5], [x + dx + 8, hgt - 8]], 'crystal', 'cyl', -1);
      });
    }
  });
}
function stalactiteStrip(): Strip {
  const mats = new Materials({ rock: '#4a4858', salt: '#c8d0dc' });
  return strip('minas:stal', W, 60, mats, (c) => {
    c.rect(0, 0, W, 8, 'rock', 'vgrad');
    for (let i = 0; i < 14; i++) {
      const x = (i + h(i, 91) * 0.7) * (W / 14), hh = 14 + h(i, 92) * 40, w = 3 + h(i, 93) * 5;
      wrap((dx) => c.poly([[x + dx - w, 6], [x + dx + w, 6], [x + dx, 6 + hh]], i % 3 ? 'rock' : 'salt', 'cyl'));
    }
  });
}
function castleWallStrip(): Strip {
  const mats = new Materials({ brick: '#3a2c4c', window: '#6a5aa8', glow: '#b8a8f0', banner: '#9a2a4a' }, '#0e0814');
  return strip('forte:wall', W, 180, mats, (c) => {
    for (let y = 0; y < 180; y++)
      for (let x = 0; x < W; x++) {
        const row = Math.floor(y / 8), off = row % 2 ? 8 : 0, bx = (x + off) % 16, by = y % 8;
        c.set(x, y, 'brick', by === 7 || bx === 15 ? 0 : by === 0 || bx === 0 ? 2 : 1);
      }
    for (let i = 0; i < 3; i++) {
      const x = 30 + i * 85;
      c.rect(x, 40, 18, 46, 'window', 'vgrad', 0);
      c.ellipse(x + 9, 40, 9, 9, 'window', 'vgrad');
      c.line(x + 9, 32, x + 9, 85, 'brick', 0); c.line(x, 62, x + 17, 62, 'brick', 0);
      c.rect(x + 2, 44, 5, 16, 'glow', 'flat', 0, 1);
      // estandarte
      c.rect(x + 48, 20, 12, 30, 'banner', 'cyl');
      c.poly([[x + 48, 50], [x + 54, 56], [x + 60, 50]], 'banner', 'flat', -1);
    }
  }, false);
}
