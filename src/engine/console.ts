/**
 * Regras de cor do console virtual.
 *
 * O console de 16 bits que serve de régua guarda cores em 15 bits (RGB555: 32 níveis por canal).
 * Todo pixel que o jogo desenha passa por aqui, então nenhuma cor "moderna" de 24 bits chega à tela,
 * e degradês ganham os degraus típicos do hardware.
 */

/** Quantiza um canal de 8 bits para 5 bits e expande de volta (como o DAC do console). */
export function q5(v: number): number {
  const q = Math.max(0, Math.min(31, Math.round((v * 31) / 255)));
  return (q << 3) | (q >> 2);
}

const hexCache = new Map<string, string>();
const rgbCache = new Map<string, [number, number, number]>();

/** Cor "#rrggbb" (ou "#rgb") -> componentes já quantizados em RGB555. */
export function rgb555Tuple(hex: string): [number, number, number] {
  let v = rgbCache.get(hex);
  if (v) return v;
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  v = [q5((n >> 16) & 255), q5((n >> 8) & 255), q5(n & 255)];
  rgbCache.set(hex, v);
  return v;
}

/** Cor "#rrggbb" quantizada em RGB555, de volta como texto. */
export function rgb555(hex: string): string {
  let v = hexCache.get(hex);
  if (v) return v;
  const [r, g, b] = rgb555Tuple(hex);
  v = '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  hexCache.set(hex, v);
  return v;
}

/** Cor entre duas, em RGB555 (degraus de hardware). */
export function mix555(a: string, b: string, t: number): string {
  const A = rgb555Tuple(a), B = rgb555Tuple(b);
  const c = (i: number): number => q5(A[i] + (B[i] - A[i]) * t);
  return '#' + ((1 << 24) | (c(0) << 16) | (c(1) << 8) | c(2)).toString(16).slice(1);
}

/** Cor de uma lista de paradas uniformes, no ponto t (0..1). */
export function sampleStops(colors: string[], t: number): string {
  if (colors.length === 1) return rgb555(colors[0]);
  const x = Math.max(0, Math.min(1, t)) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(x));
  return mix555(colors[i], colors[i + 1], x - i);
}

/** Conta cores opacas distintas numa imagem RGBA (para o fiscal de hardware). */
export function countColors(data: Uint8ClampedArray): number {
  const set = new Set<number>();
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0) set.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
  return set.size;
}

/** Limites do console virtual (ver docs/PLANO-16BIT.md). */
export const HW = {
  width: 256,
  height: 224,
  colorsPerPalette: 15,
  palettes: 8,
  voices: 8,
} as const;
