/** PRNG determinístico (mulberry32) e trigonometria por tabela, para gameplay reproduzível. */

export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
}

/** Seno por tabela de 256 passos: entrada em "voltas" (0..1 = 0..2π). Determinístico entre motores. */
const SIN_TABLE = new Float64Array(256);
for (let i = 0; i < 256; i++) SIN_TABLE[i] = Math.round(Math.sin((i / 256) * Math.PI * 2) * 4096) / 4096;

export function tsin(turns: number): number {
  const i = ((Math.floor(turns * 256) % 256) + 256) % 256;
  return SIN_TABLE[i];
}
export function tcos(turns: number): number {
  return tsin(turns + 0.25);
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
export function approach(v: number, target: number, step: number): number {
  if (v < target) return Math.min(target, v + step);
  if (v > target) return Math.max(target, v - step);
  return v;
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
export function sign(v: number): number {
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}
