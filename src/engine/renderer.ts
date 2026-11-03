/** Renderizador: buffer lógico 256x224 (o quadro do console virtual) em Canvas 2D, escalado por inteiro para a tela. */
import { glyph, FONT_W, FONT_H, textWidth } from './font';
import type { Frame, Sprite, SpriteDef } from './sprites';
import { getSprite } from './sprites';
import { rgb555, sampleStops } from './console';

export const VIEW_W = 256;
export const VIEW_H = 224;

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
    const raw = Math.min(ww / VIEW_W, wh / VIEW_H);
    // escala inteira quando possível (nitidez); em telas pequenas (celular) aceita fração para preencher
    const s = raw >= 2 ? Math.floor(raw) : Math.max(1, raw);
    this.scale = s;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = Math.floor(VIEW_W * s), cssH = Math.floor(VIEW_H * s);
    this.screen.width = Math.round(cssW * dpr);
    this.screen.height = Math.round(cssH * dpr);
    this.screen.style.width = `${cssW}px`;
    this.screen.style.height = `${cssH}px`;
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
    // paradas uniformes já bastam aqui; o desenho é feito linha a linha
    this.hdma(stops.map(([, c]) => c), y0, y1);
  }

  fillRect(x: number, y: number, w: number, h: number, color: string, world = false): void {
    const ox = world ? -this.camX + this.shakeX : 0;
    const oy = world ? -this.camY + this.shakeY : 0;
    this.ctx.fillStyle = color.charCodeAt(0) === 35 ? rgb555(color) : color;
    this.ctx.fillRect(Math.round(x + ox), Math.round(y + oy), Math.round(w), Math.round(h));
  }

  /**
   * Degradê "HDMA": uma cor por linha de varredura, interpolada entre as paradas e quantizada em
   * RGB555. Os degraus aparecem sozinhos, como nos céus dos cartuchos de 16 bits.
   */
  hdma(colors: string[], y0 = 0, y1 = VIEW_H): void {
    const top = Math.max(0, Math.round(y0)), bot = Math.min(VIEW_H, Math.round(y1));
    const span = Math.max(1, y1 - y0);
    let runStart = top, runColor = '';
    for (let y = top; y <= bot; y++) {
      const c = y < bot ? sampleStops(colors, (y - y0) / span) : '';
      if (c !== runColor) {
        if (runColor) {
          this.ctx.fillStyle = runColor;
          this.ctx.fillRect(0, runStart, VIEW_W, y - runStart);
        }
        runColor = c;
        runStart = y;
      }
    }
  }

  private scratch: HTMLCanvasElement | null = null;
  private scratchCtx(): CanvasRenderingContext2D {
    if (!this.scratch) {
      this.scratch = document.createElement('canvas');
      this.scratch.width = VIEW_W;
      this.scratch.height = VIEW_H;
    }
    const c = this.scratch.getContext('2d') as CanvasRenderingContext2D;
    c.imageSmoothingEnabled = false;
    return c;
  }

  /**
   * Deslocamento horizontal por linha (efeito de HDMA no registrador de rolagem): água, calor.
   * Linhas de y0 a y1 (tela) andam `amp` pixels numa senoide que corre com `phase`.
   */
  waveLines(y0: number, y1: number, amp: number, phase: number, period = 22): void {
    const top = Math.max(0, Math.floor(y0)), bot = Math.min(VIEW_H, Math.ceil(y1));
    if (bot <= top) return;
    const s = this.scratchCtx();
    s.clearRect(0, top, VIEW_W, bot - top);
    s.drawImage(this.buffer, 0, top, VIEW_W, bot - top, 0, top, VIEW_W, bot - top);
    // linhas consecutivas com o mesmo deslocamento viram uma faixa só (menos chamadas de desenho)
    let runStart = top;
    let runDx = Math.round(Math.sin((top + phase) * ((2 * Math.PI) / period)) * amp);
    const flush = (end: number): void => {
      const dx = runDx, h = end - runStart;
      if (dx === 0 || h <= 0) return;
      this.ctx.drawImage(this.scratch!, 0, runStart, VIEW_W, h, dx, runStart, VIEW_W, h);
      if (dx > 0) this.ctx.drawImage(this.scratch!, 0, runStart, 1, h, 0, runStart, dx, h);
      else this.ctx.drawImage(this.scratch!, VIEW_W - 1, runStart, 1, h, VIEW_W + dx, runStart, -dx, h);
    };
    for (let y = top + 1; y < bot; y++) {
      const dx = Math.round(Math.sin((y + phase) * ((2 * Math.PI) / period)) * amp);
      if (dx !== runDx) {
        flush(y);
        runStart = y;
        runDx = dx;
      }
    }
    flush(bot);
  }

  /** Mosaico do console: blocos de `size` pixels (1 = desligado). */
  mosaic(size: number): void {
    const n = Math.floor(size);
    if (n <= 1) return;
    const s = this.scratchCtx();
    const w = Math.ceil(VIEW_W / n), h = Math.ceil(VIEW_H / n);
    s.clearRect(0, 0, VIEW_W, VIEW_H);
    s.drawImage(this.buffer, 0, 0, VIEW_W, VIEW_H, 0, 0, w, h);
    this.ctx.drawImage(this.scratch!, 0, 0, w, h, 0, 0, w * n, h * n);
  }

  /** Brilho mestre em 16 níveis (15 = normal, 0 = preto), como o registrador do console. */
  brightness(level: number): void {
    const l = Math.max(0, Math.min(15, Math.round(level)));
    if (l >= 15) return;
    this.dim(1 - l / 15);
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

  text(s: string, x: number, y: number, color = '#ffffff', align: 'left' | 'center' | 'right' = 'left', shadow: string | null = '#0a0e1c'): void {
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
  textBlock(lines: string[], x: number, y: number, color = '#ffffff', shadow: string | null = '#0a0e1c', lineH = FONT_H + 2): void {
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
    c.moveTo(Math.round(cx) + Math.max(0, r), Math.round(cy));
    c.arc(Math.round(cx), Math.round(cy), Math.max(0, r), 0, Math.PI * 2, false);
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
    const ring = (scale: number): void => {
      c.beginPath();
      c.rect(0, 0, VIEW_W, VIEW_H);
      for (const l of lights) {
        const x = Math.round(l.x - this.camX), y = Math.round(l.y - this.camY), r = l.r * scale;
        c.moveTo(x + r, y);
        c.arc(x, y, r, 0, Math.PI * 2, false);
      }
      c.fill('evenodd');
    };
    ring(1);
    c.globalAlpha = alpha * 0.5;
    ring(1.35);
    c.restore();
  }
}
