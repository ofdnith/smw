/** Geração procedural de pixel art em grade de caracteres (para sprites grandes e tiles). */

export class Grid {
  cells: string[][];
  constructor(public w: number, public h: number, fill = '.') {
    this.cells = Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
  }
  set(x: number, y: number, c: string): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.cells[y][x] = c;
  }
  get(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return '.';
    return this.cells[y][x];
  }
  rect(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }
  circle(cx: number, cy: number, r: number, c: string): this {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5) this.set(x, y, c);
    return this;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
        if ((x - cx) ** 2 / (rx * rx) + (y - cy) ** 2 / (ry * ry) <= 1.05) this.set(x, y, c);
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string): this {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
    return this;
  }
  /** Contorno: células preenchidas que tocam o vazio viram 'k'. */
  outline(k = 'k'): this {
    const out = this.cells.map((r) => [...r]);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.cells[y][x] === '.') continue;
        const edge = this.get(x - 1, y) === '.' || this.get(x + 1, y) === '.' || this.get(x, y - 1) === '.' || this.get(x, y + 1) === '.';
        if (edge) out[y][x] = k;
      }
    this.cells = out;
    return this;
  }
  /** Sombreamento: células com cor `from` na metade inferior-direita viram `to`. */
  shadeBottom(from: string, to: string, fromY: number): this {
    for (let y = fromY; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.cells[y][x] === from) this.cells[y][x] = to;
    return this;
  }
  /** Escreve um fragmento de texto na posição. */
  blit(x: number, y: number, text: string): this {
    const rows = text.split('\n').filter((l) => l.trim().length > 0);
    rows.forEach((row, j) => row.split('').forEach((c, i) => c !== '.' && this.set(x + i, y + j, c)));
    return this;
  }
  flipX(): Grid {
    const g = new Grid(this.w, this.h);
    g.cells = this.cells.map((r) => [...r].reverse());
    return g;
  }
  toString(): string {
    return this.cells.map((r) => r.join('')).join('\n');
  }
}

export function g(w: number, h: number): Grid {
  return new Grid(w, h);
}
