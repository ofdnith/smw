/**
 * Pixel art em código: cada sprite é um mapa de caracteres + paleta.
 * Compilado para canvases em memória na inicialização. Nenhum PNG no repositório.
 */

export type Palette = Record<string, string | null>;

export interface SpriteDef {
  palette: Palette;
  frames: string[];
  /** Ponto de origem (âncora) em pixels a partir do topo-esquerdo. Padrão: 0,0 */
  ox?: number;
  oy?: number;
}

export interface Frame {
  img: CanvasImageSource;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

export interface Sprite {
  frames: Frame[];
  w: number;
  h: number;
}

/** Normaliza um frame de texto: remove linhas vazias nas bordas e iguala larguras. */
export function parseFrame(text: string): string[] {
  const lines = text.replace(/\r/g, '').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const w = Math.max(...lines.map((l) => l.length));
  return lines.map((l) => l.padEnd(w, '.'));
}

export function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  return new OffscreenCanvas(w, h);
}

export function compileFrame(text: string, palette: Palette, ox = 0, oy = 0, flipX = false): Frame {
  const rows = parseFrame(text);
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const canvas = makeCanvas(Math.max(1, w), Math.max(1, h));
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const data = ctx.createImageData(Math.max(1, w), Math.max(1, h));
  const cache = new Map<string, [number, number, number, number]>();
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      const col = palette[ch];
      if (!col || ch === '.' || ch === ' ') continue;
      let rgba = cache.get(col);
      if (!rgba) {
        rgba = hexToRgba(col);
        cache.set(col, rgba);
      }
      const dx = flipX ? w - 1 - x : x;
      const i = (y * w + dx) * 4;
      data.data[i] = rgba[0];
      data.data[i + 1] = rgba[1];
      data.data[i + 2] = rgba[2];
      data.data[i + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
  return { img: canvas, w, h, ox: flipX ? w - 1 - ox : ox, oy };
}

export function compileSprite(def: SpriteDef, flipX = false): Sprite {
  const frames = def.frames.map((f) => compileFrame(f, def.palette, def.ox ?? 0, def.oy ?? 0, flipX));
  return { frames, w: frames[0]?.w ?? 0, h: frames[0]?.h ?? 0 };
}

/** Cria uma variação da paleta (ex.: piscar branco, atordoado, noite). */
export function remapPalette(p: Palette, fn: (color: string, key: string) => string): Palette {
  const out: Palette = {};
  for (const k of Object.keys(p)) {
    const c = p[k];
    out[k] = c ? fn(c, k) : null;
  }
  return out;
}

export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgba(hex);
  const f = (v: number): number => Math.max(0, Math.min(255, Math.round(v + amount)));
  return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function mix(hexA: string, hexB: string, t: number): string {
  const a = hexToRgba(hexA), b = hexToRgba(hexB);
  const f = (i: number): string => Math.round(a[i] + (b[i] - a[i]) * t).toString(16).padStart(2, '0');
  return '#' + f(0) + f(1) + f(2);
}

/** Cache global de sprites compilados (normal e espelhado). */
const cache = new Map<SpriteDef, { n: Sprite; f: Sprite }>();
export function getSprite(def: SpriteDef, flipX = false): Sprite {
  let e = cache.get(def);
  if (!e) {
    e = { n: compileSprite(def, false), f: compileSprite(def, true) };
    cache.set(def, e);
  }
  return flipX ? e.f : e.n;
}

/** Ajuda para escrever frames de um sprite "mirror" (metade esquerda + espelho). */
export function mirrorFrame(halfText: string): string {
  const rows = parseFrame(halfText);
  return rows.map((r) => r + r.split('').reverse().join('')).join('\n');
}
