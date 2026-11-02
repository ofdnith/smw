/**
 * Mini-DSL para escrever fases: segmentos de colunas de mesma altura concatenados.
 * Cada segmento é um array de linhas (strings) de mesma largura. `cat` junta lado a lado.
 */

export type Seg = string[];

/** Junta segmentos horizontalmente. Todos devem ter a mesma altura. */
export function cat(...segs: Seg[]): string[] {
  const h = segs[0].length;
  const out: string[] = [];
  for (let y = 0; y < h; y++) out.push(segs.map((s) => s[y] ?? '.'.repeat(s[0].length)).join(''));
  return out;
}

/** Segmento vazio w x h. */
export function empty(w: number, h: number): Seg {
  return Array.from({ length: h }, () => '.'.repeat(w));
}

/** Chão plano: w colunas, `ground` linhas de chão a partir de baixo, com sobrescritas. */
export function flat(w: number, h: number, ground: number, tile = '#'): Seg {
  const s = empty(w, h);
  for (let y = h - ground; y < h; y++) s[y] = tile.repeat(w);
  return s;
}

/** Coloca um texto (linhas) dentro de um segmento, na posição (x,y). '.' é transparente, ' ' apaga. */
export function put(seg: Seg, x: number, y: number, art: string | string[]): Seg {
  const rows = typeof art === 'string' ? art.split('\n').filter((l) => l.length > 0) : art;
  const out = seg.map((r) => r.split(''));
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '.') continue;
      const yy = y + j, xx = x + i;
      if (yy < 0 || yy >= out.length || xx < 0 || xx >= out[0].length) continue;
      out[yy][xx] = c === ' ' ? '.' : c;
    }
  });
  return out.map((r) => r.join(''));
}

/** Coloca caracteres individuais: lista de [x, y, char]. */
export function dots(seg: Seg, list: [number, number, string][]): Seg {
  let s = seg;
  for (const [x, y, c] of list) s = put(s, x, y, c);
  return s;
}

/** Linha horizontal de um caractere. */
export function hline(seg: Seg, x: number, y: number, w: number, c: string): Seg {
  return put(seg, x, y, c.repeat(w));
}
export function vline(seg: Seg, x: number, y: number, h: number, c: string): Seg {
  return put(seg, x, y, Array.from({ length: h }, () => c));
}
/** Retângulo preenchido. */
export function box(seg: Seg, x: number, y: number, w: number, h: number, c: string): Seg {
  return put(seg, x, y, Array.from({ length: h }, () => c.repeat(w)));
}

/** Morro: sobe com rampa de 45°, platô, desce. ground = altura base. */
export function hill(h: number, ground: number, up: number, top: number, tile = '#'): Seg {
  const w = up * 2 + top;
  let s = flat(w, h, ground, tile);
  for (let i = 0; i < up; i++) {
    // coluna i: altura ground + i + 1 com rampa no topo
    const colH = ground + i;
    s = vline(s, i, h - colH, colH, tile);
    s = put(s, i, h - colH - 1, '/');
    const xr = w - 1 - i;
    s = vline(s, xr, h - colH, colH, tile);
    s = put(s, xr, h - colH - 1, '\\');
  }
  s = box(s, up, h - ground - up, top, up, tile);
  return s;
}

/** Degraus subindo para a direita. */
export function stairsUp(h: number, ground: number, steps: number, stepW = 2, tile = '#'): Seg {
  let s = flat(steps * stepW, h, ground, tile);
  for (let i = 1; i < steps; i++) s = box(s, i * stepW, h - ground - i, stepW, i, tile);
  return s;
}
export function stairsDown(h: number, ground: number, steps: number, stepW = 2, tile = '#'): Seg {
  return stairsUp(h, ground, steps, stepW, tile).map((r) => r.split('').reverse().join(''));
}

/** Buraco (sem chão) de largura w. */
export function gap(w: number, h: number): Seg {
  return empty(w, h);
}

/** Poço d'água: chão baixo com água até `level` linhas acima do fundo. */
export function pool(w: number, h: number, floor: number, depth: number): Seg {
  let s = flat(w, h, floor);
  for (let y = h - floor - depth; y < h - floor; y++) s = hline(s, 0, y, w, y === h - floor - depth ? 'W' : '~');
  return s;
}

/** Pilar/plataforma flutuante de largura w no y dado (linhas a partir do topo). */
export function platform(seg: Seg, x: number, y: number, w: number): Seg {
  return hline(seg, x, y, w, '=');
}
