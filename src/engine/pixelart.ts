/**
 * Escultor de pixel art 16 bits: formas com rampas de 5 tons, luz de cima-esquerda,
 * sombras puxadas para o azul e brilhos para o amarelo, e contorno escuro seletivo.
 * O resultado é um frame em texto + paleta, compatível com SpriteDef.
 *
 * Tons: 0 = sombra profunda, 1 = sombra, 2 = base, 3 = luz, 4 = brilho.
 */
import type { Palette } from './sprites';
import { hexToRgba } from './sprites';

/** Caracteres disponíveis para cores (o '.' é vazio). */
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&*+-=?@^_~<>/|;:,()[]{}ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ';
export const OUTLINE_CHAR = '`';

// ------------------------------------------------------------------ cor

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const f = (v: number): string => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
/** Gira o matiz `amt` graus na direção de `target` pelo caminho mais curto. */
function hueToward(h: number, target: number, amt: number): number {
  let d = target - h;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return h + Math.sign(d) * Math.min(Math.abs(d), amt);
}

/** Rampa de 5 tons a partir de uma cor base (sombras frias, luzes quentes). */
export function ramp(base: string): string[] {
  const [r, g, b] = hexToRgba(base);
  const [h, s, l] = rgbToHsl(r, g, b);
  const grey = s < 0.08;
  const sh = (amt: number): number => (grey ? h : hueToward(h, 245, amt));
  const hi = (amt: number): number => (grey ? h : hueToward(h, 55, amt));
  return [
    hslToHex(sh(28), Math.min(1, s * 1.05 + (grey ? 0 : 0.05)), l * 0.42),
    hslToHex(sh(14), Math.min(1, s * 1.02), l * 0.7),
    base,
    hslToHex(hi(10), s * 0.95, l + (1 - l) * 0.32),
    hslToHex(hi(18), s * 0.75, l + (1 - l) * 0.62),
  ];
}

// ------------------------------------------------------------------ materiais

export interface Material { name: string; ramp: string[]; index: number }

/** Conjunto de materiais de um sprite (ou família de sprites que compartilham paleta). */
export class Materials {
  readonly list: Material[] = [];
  outline: string;
  constructor(defs: Record<string, string | string[]>, outline = '#1a1226') {
    for (const [name, v] of Object.entries(defs)) this.list.push({ name, ramp: typeof v === 'string' ? ramp(v) : v, index: this.list.length });
    this.outline = outline;
  }
  get(name: string): Material {
    const m = this.list.find((x) => x.name === name);
    if (!m) throw new Error('material inexistente: ' + name);
    return m;
  }
  /** Paleta para SpriteDef (opcionalmente trocando a cor base de alguns materiais). */
  palette(override: Record<string, string> = {}): Palette {
    const p: Palette = { '.': null, [OUTLINE_CHAR]: this.outline };
    for (const m of this.list) {
      const r = override[m.name] ? ramp(override[m.name]) : m.ramp;
      for (let t = 0; t < 5; t++) p[charFor(m.index, t)] = r[t];
    }
    return p;
  }
}

export function charFor(matIndex: number, tone: number): string {
  const i = matIndex * 5 + tone;
  if (i >= CHARS.length) throw new Error('materiais demais num sprite');
  return CHARS[i];
}

// ------------------------------------------------------------------ tela

type Shade = 'sphere' | 'flat' | 'box' | 'cyl' | 'vgrad';
interface Px { m: number; t: number }

const L = (() => { const v = [-0.55, -0.7, 0.55]; const n = Math.hypot(v[0], v[1], v[2]); return v.map((c) => c / n); })();

function toneFromLight(d: number): number {
  if (d > 0.9) return 4;
  if (d > 0.62) return 3;
  if (d > 0.18) return 2;
  if (d > -0.25) return 1;
  return 0;
}

export class Canvas {
  px: (Px | null)[];
  constructor(readonly w: number, readonly h: number, readonly mats: Materials) {
    this.px = new Array(w * h).fill(null);
  }
  private m(name: string | Material): Material { return typeof name === 'string' ? this.mats.get(name) : name; }

  set(x: number, y: number, mat: string | Material, tone = 2): this {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.px[y * this.w + x] = { m: this.m(mat).index, t: Math.max(0, Math.min(4, tone)) };
    return this;
  }
  get(x: number, y: number): Px | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x];
  }
  clear(x: number, y: number): this {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = null;
    return this;
  }
  /** Pixel na cor do contorno (olhos, costuras). */
  ink(x: number, y: number): this {
    x = Math.floor(x); y = Math.floor(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = { m: -1, t: 0 };
    return this;
  }
  /** Nova tela vazia do mesmo tamanho e materiais (para desenhar em camadas). */
  layer(): Canvas {
    return new Canvas(this.w, this.h, this.mats);
  }
  /** Ajusta o tom de um pixel já pintado (sombras de contato, brilhos). */
  tone(x: number, y: number, delta: number): this {
    const p = this.get(x, y);
    if (p) p.t = Math.max(0, Math.min(4, p.t + delta));
    return this;
  }

  /** Elipse sombreada como volume (esfera) ou chapada. */
  ellipse(cx: number, cy: number, rx: number, ry: number, mat: string, shade: Shade = 'sphere', bias = 0): this {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const q = nx * nx + ny * ny;
        if (q > 1.0) continue;
        this.set(x, y, mat, this.shadeAt(nx, ny, q, shade) + bias);
      }
    return this;
  }
  circle(cx: number, cy: number, r: number, mat: string, shade: Shade = 'sphere', bias = 0): this {
    return this.ellipse(cx, cy, r, r, mat, shade, bias);
  }
  private shadeAt(nx: number, ny: number, q: number, shade: Shade): number {
    switch (shade) {
      case 'flat': return 2;
      case 'vgrad': return ny < -0.45 ? 3 : ny > 0.55 ? 1 : 2;
      case 'cyl': { const nz = Math.sqrt(Math.max(0, 1 - nx * nx)); return toneFromLight(nx * L[0] + nz * L[2] + 0.1); }
      case 'box': return ny < -0.7 || nx < -0.75 ? 3 : ny > 0.7 || nx > 0.75 ? 1 : 2;
      default: { const nz = Math.sqrt(Math.max(0, 1 - q)); return toneFromLight(nx * L[0] + ny * L[1] + nz * L[2]); }
    }
  }

  /** Retângulo (com cantos arredondados opcionais) com sombreamento de caixa. */
  rect(x: number, y: number, w: number, h: number, mat: string, shade: Shade = 'box', round = 0, bias = 0): this {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if (round > 0) {
          const cx = i < round ? round - i - 0.5 : i >= w - round ? i - (w - round) + 0.5 : 0;
          const cy = j < round ? round - j - 0.5 : j >= h - round ? j - (h - round) + 0.5 : 0;
          if (cx > 0 && cy > 0 && cx * cx + cy * cy > round * round) continue;
        }
        const nx = w > 1 ? (i / (w - 1)) * 2 - 1 : 0, ny = h > 1 ? (j / (h - 1)) * 2 - 1 : 0;
        let t: number;
        if (shade === 'box') t = j === 0 || i === 0 ? 3 : j === h - 1 || i === w - 1 ? 1 : 2;
        else if (shade === 'sphere') t = this.shadeAt(nx * 0.9, ny * 0.9, Math.min(1, (nx * nx + ny * ny) * 0.8), 'sphere');
        else t = this.shadeAt(nx, ny, nx * nx + ny * ny, shade);
        this.set(x + i, y + j, mat, t + bias);
      }
    return this;
  }

  /** Polígono preenchido (pontos em pixels). */
  poly(pts: [number, number][], mat: string, shade: Shade = 'vgrad', bias = 0): this {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs));
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    const inside = (px: number, py: number): boolean => {
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (!inside(x + 0.5, y + 0.5)) continue;
        const nx = x1 > x0 ? ((x - x0) / (x1 - x0)) * 2 - 1 : 0, ny = y1 > y0 ? ((y - y0) / (y1 - y0)) * 2 - 1 : 0;
        this.set(x, y, mat, this.shadeAt(nx, ny, Math.min(1, nx * nx + ny * ny), shade) + bias);
      }
    return this;
  }

  /** Linha com espessura (membros, hastes); tom fixo. */
  line(x0: number, y0: number, x1: number, y1: number, mat: string, tone = 2, thick = 1): this {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      if (thick <= 1) this.set(Math.round(x), Math.round(y), mat, tone);
      else for (let dy = 0; dy < thick; dy++) for (let dx = 0; dx < thick; dx++) this.set(Math.round(x - (thick - 1) / 2) + dx, Math.round(y - (thick - 1) / 2) + dy, mat, tone);
    }
    return this;
  }

  /** Pinta pixels com um mapa de texto: cada caractere aponta para [material, tom] pela legenda. */
  stamp(x: number, y: number, art: string, legend: Record<string, [string, number]>): this {
    const rows = art.split('\n').filter((r) => r.length > 0);
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === '.' || c === ' ') continue;
        if (c === '_') { this.clear(x + i, y + j); continue; }
        const lg = legend[c];
        if (lg) this.set(x + i, y + j, lg[0], lg[1]);
      }
    });
    return this;
  }

  /** Copia outra tela por cima (mesmos materiais). */
  draw(other: Canvas, ox: number, oy: number, flip = false): this {
    for (let y = 0; y < other.h; y++)
      for (let x = 0; x < other.w; x++) {
        const p = other.get(flip ? other.w - 1 - x : x, y);
        if (p) this.px[(oy + y) * this.w + (ox + x)] = { ...p };
      }
    return this;
  }

  /** Espelha a tela horizontalmente. */
  flipped(): Canvas {
    const c = new Canvas(this.w, this.h, this.mats);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) c.px[y * this.w + x] = this.px[y * this.w + (this.w - 1 - x)];
    return c;
  }

  /** Escurece um tom onde um material encosta em outro abaixo/à direita (sombra de contato). */
  contactShadow(upperMat: string, lowerMat: string): this {
    const a = this.m(upperMat).index, b = this.m(lowerMat).index;
    for (let y = 0; y < this.h - 1; y++)
      for (let x = 0; x < this.w; x++) {
        const p = this.get(x, y), q = this.get(x, y + 1);
        if (p && q && p.m === a && q.m === b) q.t = Math.max(0, q.t - 1);
      }
    return this;
  }

  /** Contorno externo: vazio que toca pixel pintado vira contorno (exceto onde `skip` diz). */
  outline(opts: { diagonal?: boolean; skipMats?: string[] } = {}): this {
    const skip = new Set((opts.skipMats ?? []).map((n) => this.m(n).index));
    const out: boolean[] = new Array(this.w * this.h).fill(false);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const ns = [[1, 0], [-1, 0], [0, 1], [0, -1], ...(opts.diagonal ? [[1, 1], [-1, 1], [1, -1], [-1, -1]] : [])];
        for (const [dx, dy] of ns) {
          const p = this.get(x + dx, y + dy);
          if (p && p.m !== -1 && !skip.has(p.m)) { out[y * this.w + x] = true; break; }
        }
      }
    for (let i = 0; i < out.length; i++) if (out[i]) this.px[i] = { m: -1, t: 0 };
    return this;
  }

  /** Linha interna entre dois materiais (separa rosto do chapéu, etc.). */
  innerLine(matA: string, matB: string): this {
    const a = this.m(matA).index, b = this.m(matB).index;
    const marks: number[] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const p = this.get(x, y);
        if (!p || p.m !== a) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const q = this.get(x + dx, y + dy);
          if (q && q.m === b) { marks.push(y * this.w + x); break; }
        }
      }
    for (const i of marks) this.px[i] = { m: -1, t: 0 };
    return this;
  }

  /** Frame em texto. */
  toString(): string {
    const rows: string[] = [];
    for (let y = 0; y < this.h; y++) {
      let r = '';
      for (let x = 0; x < this.w; x++) {
        const p = this.px[y * this.w + x];
        r += !p ? '.' : p.m === -1 ? OUTLINE_CHAR : charFor(p.m, p.t);
      }
      rows.push(r);
    }
    return '\n' + rows.join('\n');
  }
}

/** Atalho: cria uma tela, deixa a função desenhar e devolve o frame em texto. */
export function sculpt(w: number, h: number, mats: Materials, fn: (c: Canvas) => void): string {
  const c = new Canvas(w, h, mats);
  fn(c);
  return c.toString();
}

/** Gera a imagem direto em pixels (sem limite de cores): para mapas e faixas grandes. */
export function canvasToFrame(c: Canvas): { img: CanvasImageSource; w: number; h: number; ox: number; oy: number } {
  const el: HTMLCanvasElement | OffscreenCanvas = typeof document !== 'undefined'
    ? Object.assign(document.createElement('canvas'), { width: c.w, height: c.h })
    : new OffscreenCanvas(c.w, c.h);
  const ctx = el.getContext('2d') as CanvasRenderingContext2D;
  const data = ctx.createImageData(c.w, c.h);
  const rgb = new Map<string, [number, number, number]>();
  const hex = (h: string): [number, number, number] => {
    let v = rgb.get(h);
    if (!v) { const n = parseInt(h.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; rgb.set(h, v); }
    return v;
  };
  for (let i = 0; i < c.w * c.h; i++) {
    const p = c.px[i];
    if (!p) continue;
    const [r, g, b] = hex(p.m < 0 ? c.mats.outline : c.mats.list[p.m].ramp[p.t]);
    data.data[i * 4] = r; data.data[i * 4 + 1] = g; data.data[i * 4 + 2] = b; data.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  return { img: el, w: c.w, h: c.h, ox: 0, oy: 0 };
}
