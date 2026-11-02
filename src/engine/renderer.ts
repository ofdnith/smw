/** Renderizador: buffer lógico 320x180 em Canvas 2D, escalado por inteiro para a tela. */
import { glyph, FONT_W, FONT_H, textWidth } from './font';
import type { Frame, Sprite, SpriteDef } from './sprites';
import { getSprite } from './sprites';

export const VIEW_W = 320;
export const VIEW_H = 180;

export class Renderer {
  readonly buffer: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private readonly screen: HTMLCanvasElement;
  private readonly sctx: CanvasRenderingContext2D;
  scale = 1;
  /** Deslocamento de câmera aplicado por drawSprite/drawFrame/fillRect quando world=true. */
  camX = 0;
  camY = 0;
  shakeX = 0;
  shakeY = 0;

  constructor(screen: HTMLCanvasElement) {
    this.screen = screen;
    this.buffer = document.createElement('canvas');
    this.buffer.width = VIEW_W;
    this.buffer.height = VIEW_H;
    this.ctx = this.buffer.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.ctx.imageSmoothingEnabled = false;
    this.sctx = screen.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const ww = window.innerWidth, wh = window.innerHeight;
    const s = Math.max(1, Math.floor(Math.min(ww / VIEW_W, wh / VIEW_H)));
    this.scale = s;
    const dpr = 1;
    this.screen.width = VIEW_W * s * dpr;
    this.screen.height = VIEW_H * s * dpr;
    this.screen.style.width = `${VIEW_W * s}px`;
    this.screen.style.height = `${VIEW_H * s}px`;
    this.sctx.imageSmoothingEnabled = false;
  }

  /** Copia o buffer para a tela. */
  present(): void {
    this.sctx.imageSmoothingEnabled = false;
    this.sctx.drawImage(this.buffer, 0, 0, this.screen.width, this.screen.height);
  }

  clear(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  /** Gradiente vertical de céu. */
  gradient(stops: [number, string][], y0 = 0, y1 = VIEW_H): void {
    const g = this.ctx.createLinearGradient(0, y0, 0, y1);
    for (const [t, c] of stops) g.addColorStop(t, c);
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, y0, VIEW_W, y1 - y0);
  }

  fillRect(x: number, y: number, w: number, h: number, color: string, world = false): void {
    const ox = world ? -this.camX + this.shakeX : 0;
    const oy = world ? -this.camY + this.shakeY : 0;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x + ox), Math.round(y + oy), Math.round(w), Math.round(h));
  }

  drawFrame(f: Frame, x: number, y: number, world = true, alpha = 1): void {
    const ox = world ? -this.camX + this.shakeX : 0;
    const oy = world ? -this.camY + this.shakeY : 0;
    const dx = Math.round(x - f.ox + ox), dy = Math.round(y - f.oy + oy);
    if (dx + f.w < 0 || dy + f.h < 0 || dx > VIEW_W || dy > VIEW_H) return;
    if (alpha !== 1) this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(f.img, dx, dy);
    if (alpha !== 1) this.ctx.globalAlpha = 1;
  }

  drawSprite(def: SpriteDef, frame: number, x: number, y: number, flipX = false, world = true, alpha = 1): void {
    const s: Sprite = getSprite(def, flipX);
    const f = s.frames[frame % s.frames.length];
    if (f) this.drawFrame(f, x, y, world, alpha);
  }

  /** Desenha um frame com escala (usado em efeitos e no título). */
  drawFrameScaled(f: Frame, x: number, y: number, sx: number, sy: number, world = false): void {
    const ox = world ? -this.camX : 0;
    const oy = world ? -this.camY : 0;
    this.ctx.drawImage(f.img, Math.round(x + ox), Math.round(y + oy), Math.round(f.w * sx), Math.round(f.h * sy));
  }

  text(s: string, x: number, y: number, color = '#ffffff', align: 'left' | 'center' | 'right' = 'left', shadow?: string): void {
    const w = textWidth(s);
    let cx = Math.round(x);
    if (align === 'center') cx -= Math.floor(w / 2);
    else if (align === 'right') cx -= w;
    const cy = Math.round(y);
    if (shadow) {
      for (let i = 0; i < s.length; i++) {
        const g = glyph(s[i], shadow);
        if (g) this.ctx.drawImage(g.img, cx + i * FONT_W + 1, cy + 1);
      }
    }
    for (let i = 0; i < s.length; i++) {
      const g = glyph(s[i], color);
      if (g) this.ctx.drawImage(g.img, cx + i * FONT_W, cy);
    }
  }

  /** Texto com quebra de linha simples, centralizado. */
  textBlock(lines: string[], x: number, y: number, color = '#ffffff', shadow?: string, lineH = FONT_H + 2): void {
    lines.forEach((l, i) => this.text(l, x, y + i * lineH, color, 'center', shadow));
  }

  /** Caixa de diálogo estilizada. */
  box(x: number, y: number, w: number, h: number, fill = '#101a2e', border = '#f4c430'): void {
    this.fillRect(x, y, w, h, border);
    this.fillRect(x + 1, y + 1, w - 2, h - 2, fill);
    this.fillRect(x + 1, y + 1, 1, 1, fill); this.fillRect(x + w - 2, y + 1, 1, 1, fill);
    this.fillRect(x + 1, y + h - 2, 1, 1, fill); this.fillRect(x + w - 2, y + h - 2, 1, 1, fill);
  }

  /** Escurece toda a tela com alpha. */
  dim(alpha: number, color = '#000000'): void {
    if (alpha <= 0) return;
    this.ctx.globalAlpha = Math.min(1, alpha);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.ctx.globalAlpha = 1;
  }

  /** Transição de íris (círculo) centrada em cx,cy, raio r. */
  iris(cx: number, cy: number, r: number, color = '#000000'): void {
    const c = this.ctx;
    c.save();
    c.fillStyle = color;
    c.beginPath();
    c.rect(0, 0, VIEW_W, VIEW_H);
    c.arc(Math.round(cx), Math.round(cy), Math.max(0, r), 0, Math.PI * 2, true);
    c.fill('evenodd');
    c.restore();
  }

  circle(cx: number, cy: number, r: number, color: string, world = true): void {
    const ox = world ? -this.camX : 0, oy = world ? -this.camY : 0;
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.arc(Math.round(cx + ox), Math.round(cy + oy), r, 0, Math.PI * 2);
    c.fill();
  }

  /** Luz radial recortada (fase escura): tudo fora do raio fica preto. */
  darkness(lights: { x: number; y: number; r: number }[], alpha = 0.96): void {
    const c = this.ctx;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = '#02030a';
    c.beginPath();
    c.rect(0, 0, VIEW_W, VIEW_H);
    for (const l of lights) c.arc(Math.round(l.x - this.camX), Math.round(l.y - this.camY), l.r, 0, Math.PI * 2, true);
    c.fill('evenodd');
    c.globalAlpha = alpha * 0.5;
    c.beginPath();
    c.rect(0, 0, VIEW_W, VIEW_H);
    for (const l of lights) c.arc(Math.round(l.x - this.camX), Math.round(l.y - this.camY), l.r * 1.35, 0, Math.PI * 2, true);
    c.fill('evenodd');
    c.restore();
  }
}
