/**
 * Banco de instrumentos do console virtual.
 *
 * Todo sample nasce aqui, por síntese offline em código (aditiva, parciais inarmônicas e ruído
 * com PRNG fixo), a 32 kHz. Depois passa pelo codec ADPCM de 4 bits e por um filtro de suavização
 * que imita a interpolação dos chips de 16 bits: é isso que dá o som quente e um pouco abafado.
 *
 * Instrumentos sustentados têm loop perfeito: cada parcial tem um número inteiro de ciclos dentro
 * do trecho de loop, então o fim encaixa no começo sem clique.
 */
import { encode, decode } from './adpcm';

export const SR = 32000;

export interface Instrument {
  name: string;
  data: Float32Array;
  /** frequência tocada com playbackRate 1 */
  root: number;
  /** trecho de loop em samples (ausente = toca uma vez) */
  loopStart?: number;
  loopEnd?: number;
  /** tamanho comprimido em bytes (para o orçamento de memória de som) */
  bytes: number;
}

/** PRNG determinístico (LCG) para o ruído dos samples. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2147483648 - 1;
  };
}

interface Partial {
  /** múltiplo da fundamental (arredondado para bin inteiro) */
  ratio: number;
  amp: number;
  /** constante de decaimento em segundos durante o ataque (ausente = estável) */
  tau?: number;
  /** desafinação em bins (coro/chorus) */
  det?: number;
}

interface AdditiveOpts {
  partials: Partial[];
  /** tamanho do loop em samples (potência de 2) */
  L: number;
  /** bin da fundamental dentro do loop */
  k0: number;
  /** duração do ataque antes do loop, em segundos */
  attack: number;
  /** subida inicial em segundos */
  rise?: number;
  /** transiente de ataque: ruído (nível e decaimento) */
  noise?: { amp: number; tau: number; hp?: number };
  /** parciais altas entram depois (sopro de metal) */
  swell?: number;
  seed: number;
}

function additive(o: AdditiveOpts): { data: Float32Array; loopStart: number; loopEnd: number; root: number } {
  const A = Math.round(o.attack * SR);
  const N = A + o.L;
  const out = new Float32Array(N);
  const r = rng(o.seed);
  for (const p of o.partials) {
    const bin = Math.max(1, Math.round(o.k0 * p.ratio) + (p.det ?? 0));
    if (bin >= o.L / 2 - 1) continue;
    const w = (2 * Math.PI * bin) / o.L;
    const ph = (r() + 1) * Math.PI;
    const tau = p.tau ? p.tau * SR : 0;
    const swell = o.swell ? o.swell * SR * Math.min(1, p.ratio / 6) : 0;
    for (let n = 0; n < N; n++) {
      const m = n < A ? n : A;
      let a = p.amp;
      if (tau) a *= Math.exp(-m / tau);
      if (swell && m < swell) a *= m / swell;
      out[n] += a * Math.sin(w * n + ph);
    }
  }
  const rise = Math.round((o.rise ?? 0.004) * SR);
  for (let n = 0; n < Math.min(rise, A); n++) out[n] *= n / rise;
  if (o.noise) {
    const nr = rng(o.seed ^ 0x5a5a);
    const tau = o.noise.tau * SR;
    let prev = 0, lp = 0;
    const hp = o.noise.hp ?? 0.5;
    for (let n = 0; n < Math.min(A, tau * 6); n++) {
      const x = nr();
      const h = x - prev * hp; // passa-altas simples
      prev = x;
      lp += (h - lp) * 0.5;
      out[n] += lp * o.noise.amp * Math.exp(-n / tau);
    }
  }
  return { data: out, loopStart: A, loopEnd: N, root: (o.k0 * SR) / o.L };
}

/** Série de serra (1/n^k) até um teto de frequência. */
function sawPartials(maxN: number, tilt: number, extra: Partial = { ratio: 0, amp: 0 }): Partial[] {
  const ps: Partial[] = [];
  for (let n = 1; n <= maxN; n++) ps.push({ ratio: n, amp: 1 / Math.pow(n, tilt), tau: extra.tau, det: extra.det });
  return ps;
}

function detuned(ps: Partial[], dets: number[], gain = 1): Partial[] {
  return dets.flatMap((d) => ps.map((p) => ({ ...p, det: d, amp: (p.amp * gain) / dets.length })));
}

/** Formantes de vogal "a" aberta (nossas, aproximadas). */
function formant(f: number): number {
  const peaks: [number, number, number][] = [[720, 120, 1], [1180, 130, 0.5], [2550, 180, 0.25]];
  let g = 0.04;
  for (const [c, bw, a] of peaks) g += a / (1 + ((f - c) / bw) ** 2);
  return g;
}

type Recipe = () => { data: Float32Array; loopStart?: number; loopEnd?: number; root: number };

const LOOP = 8192;
const LOOP_WIDE = 16384;

/** Gerador de percussão no domínio do tempo. */
function drum(len: number, fn: (t: number, n: number, noise: () => number) => number, seed: number): Float32Array {
  const N = Math.round(len * SR);
  const out = new Float32Array(N);
  const r = rng(seed);
  for (let n = 0; n < N; n++) out[n] = fn(n / SR, n, r);
  // fim suave
  const tail = Math.min(256, N);
  for (let i = 0; i < tail; i++) out[N - 1 - i] *= i / tail;
  return out;
}

/** Ruído metálico: soma de ondas quadradas em frequências inarmônicas (prato, chimbal). */
function metal(t: number): number {
  const fs = [317, 431, 563, 709, 811, 1013];
  let s = 0;
  for (const f of fs) s += Math.sin(2 * Math.PI * f * 3.1 * t) > 0 ? 1 : -1;
  return s / fs.length;
}

/** Passa-altas de um polo aplicado em sequência (estado por gerador). */
function hpFilter(a: number): (x: number) => number {
  let px = 0, py = 0;
  return (x: number) => {
    const y = a * (py + x - px);
    px = x;
    py = y;
    return y;
  };
}
function lpFilter(a: number): (x: number) => number {
  let y = 0;
  return (x: number) => (y += (x - y) * a);
}

const RECIPES: Record<string, Recipe> = {
  // ---------- sopros ----------
  flauta: () => additive({ L: LOOP, k0: 64, attack: 0.08, rise: 0.04, seed: 11,
    partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.22 }, { ratio: 3, amp: 0.1 }, { ratio: 4, amp: 0.035 }, { ratio: 5, amp: 0.015 }],
    noise: { amp: 0.25, tau: 0.03, hp: 0.9 } }),
  ocarina: () => additive({ L: LOOP, k0: 64, attack: 0.05, rise: 0.025, seed: 12,
    partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.05 }, { ratio: 3, amp: 0.07 }, { ratio: 5, amp: 0.01 }],
    noise: { amp: 0.15, tau: 0.02, hp: 0.9 } }),
  metais: () => additive({ L: LOOP, k0: 64, attack: 0.09, rise: 0.012, swell: 0.07, seed: 13,
    partials: sawPartials(16, 1.05).map((p) => ({ ...p, amp: p.amp * (p.ratio > 9 ? 0.5 : 1) })) }),
  acordeao: () => additive({ L: LOOP_WIDE, k0: 128, attack: 0.03, rise: 0.015, seed: 14,
    partials: detuned(Array.from({ length: 14 }, (_, i) => ({ ratio: i + 1, amp: Math.abs(Math.sin((i + 1) * Math.PI * 0.32)) / Math.pow(i + 1, 0.8) })), [0, 2]) }),
  // ---------- cordas e vozes ----------
  cordas: () => additive({ L: LOOP_WIDE, k0: 128, attack: 0.02, seed: 21,
    partials: detuned(sawPartials(18, 1.25), [-1, 0, 1]) }),
  coro: () => additive({ L: LOOP_WIDE, k0: 128, attack: 0.02, seed: 22,
    partials: detuned(Array.from({ length: 24 }, (_, i) => ({ ratio: i + 1, amp: formant(250 * (i + 1)) / Math.sqrt(i + 1) })), [-1, 1]) }),
  pad: () => additive({ L: LOOP_WIDE, k0: 128, attack: 0.02, seed: 23,
    partials: detuned(sawPartials(10, 1.8), [-1, 0, 1]) }),
  orgao: () => additive({ L: LOOP, k0: 64, attack: 0.02, rise: 0.003, seed: 24,
    partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.7 }, { ratio: 3, amp: 0.45 }, { ratio: 4, amp: 0.35 }, { ratio: 6, amp: 0.2 }, { ratio: 8, amp: 0.22 }],
    noise: { amp: 0.12, tau: 0.004 } }),
  // ---------- dedilhados ----------
  harpa: () => additive({ L: LOOP, k0: 64, attack: 0.7, rise: 0.001, seed: 31,
    partials: Array.from({ length: 12 }, (_, i) => ({ ratio: i + 1, amp: Math.abs(Math.sin((i + 1) * Math.PI * 0.2)) / Math.pow(i + 1, 1.3), tau: 1.1 / Math.pow(i + 1, 0.7) })) }),
  violao: () => additive({ L: LOOP, k0: 64, attack: 0.55, rise: 0.001, seed: 32,
    partials: Array.from({ length: 16 }, (_, i) => ({ ratio: i + 1, amp: Math.abs(Math.sin((i + 1) * Math.PI * 0.14)) / Math.pow(i + 1, 1.1), tau: 0.8 / Math.pow(i + 1, 0.8) })),
    noise: { amp: 0.2, tau: 0.004 } }),
  pizz: () => additive({ L: LOOP, k0: 64, attack: 0.3, rise: 0.001, seed: 33,
    partials: Array.from({ length: 12 }, (_, i) => ({ ratio: i + 1, amp: 1 / Math.pow(i + 1, 1.2), tau: 0.16 / Math.pow(i + 1, 0.5) })),
    noise: { amp: 0.15, tau: 0.003 } }),
  baixo: () => additive({ L: LOOP, k0: 64, attack: 0.45, rise: 0.002, seed: 34,
    partials: Array.from({ length: 10 }, (_, i) => ({ ratio: i + 1, amp: 1 / Math.pow(i + 1, 1.5), tau: 1.2 / Math.pow(i + 1, 0.9) })),
    noise: { amp: 0.08, tau: 0.003 } }),
  slap: () => additive({ L: LOOP, k0: 64, attack: 0.35, rise: 0.001, seed: 35,
    partials: Array.from({ length: 18 }, (_, i) => ({ ratio: i + 1, amp: 1 / Math.pow(i + 1, 0.95), tau: 0.5 / Math.pow(i + 1, 0.6) })),
    noise: { amp: 0.4, tau: 0.003 } }),
  // ---------- percussão afinada ----------
  marimba: () => additive({ L: LOOP, k0: 64, attack: 0.5, rise: 0.001, seed: 41,
    partials: [{ ratio: 1, amp: 1, tau: 0.35 }, { ratio: 3.9, amp: 0.3, tau: 0.07 }, { ratio: 9.3, amp: 0.1, tau: 0.025 }],
    noise: { amp: 0.25, tau: 0.003 } }),
  steel: () => additive({ L: LOOP, k0: 64, attack: 0.6, rise: 0.001, seed: 42,
    partials: [{ ratio: 1, amp: 1, tau: 0.55 }, { ratio: 2, amp: 0.55, tau: 0.35 }, { ratio: 3, amp: 0.3, tau: 0.2 }, { ratio: 4.25, amp: 0.15, tau: 0.08 }, { ratio: 5.6, amp: 0.08, tau: 0.05 }],
    noise: { amp: 0.1, tau: 0.004 } }),
  sino: () => additive({ L: LOOP, k0: 64, attack: 0.9, rise: 0.001, seed: 43,
    partials: [{ ratio: 0.5, amp: 0.3, tau: 2.5 }, { ratio: 1, amp: 1, tau: 1.6 }, { ratio: 2.76, amp: 0.45, tau: 0.8 }, { ratio: 5.4, amp: 0.25, tau: 0.35 }, { ratio: 8.9, amp: 0.12, tau: 0.15 }] }),
  celesta: () => additive({ L: LOOP, k0: 64, attack: 0.6, rise: 0.001, seed: 44,
    partials: [{ ratio: 1, amp: 1, tau: 0.7 }, { ratio: 4, amp: 0.28, tau: 0.1 }, { ratio: 10, amp: 0.07, tau: 0.03 }] }),
  eletrico: () => additive({ L: LOOP, k0: 64, attack: 0.6, rise: 0.001, seed: 45,
    partials: [{ ratio: 1, amp: 1, tau: 1.4 }, { ratio: 2, amp: 0.28, tau: 0.5 }, { ratio: 3, amp: 0.1, tau: 0.3 }, { ratio: 14, amp: 0.07, tau: 0.04 }] }),
  // ---------- tons de efeito ----------
  blip: () => additive({ L: LOOP, k0: 64, attack: 0.01, seed: 51,
    partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.45 }, { ratio: 3, amp: 0.3 }, { ratio: 4, amp: 0.12 }, { ratio: 5, amp: 0.15 }, { ratio: 7, amp: 0.06 }] }),
  suave: () => additive({ L: LOOP, k0: 64, attack: 0.01, seed: 52,
    partials: [{ ratio: 1, amp: 1 }, { ratio: 2, amp: 0.12 }, { ratio: 3, amp: 0.1 }] }),
  ruido: () => {
    const N = LOOP;
    const r = rng(53);
    const lp = lpFilter(0.7);
    const d = new Float32Array(N);
    for (let n = 0; n < N; n++) d[n] = lp(r()) * 0.9;
    return { data: d, loopStart: 0, loopEnd: N, root: 440 };
  },
  // ---------- bateria ----------
  bumbo: () => ({ root: 440, data: drum(0.32, (t, n, r) => {
    // frequência cai de ~158 Hz para 48 Hz; a fase é a integral dessa curva
    const ph = 2 * Math.PI * (48 * t + 110 * 0.035 * (1 - Math.exp(-t / 0.035)));
    return Math.sin(ph) * Math.exp(-t / 0.13) + (n < 64 ? r() * 0.35 * (1 - n / 64) : 0);
  }, 61) }),
  caixa: () => {
    const hp = hpFilter(0.6), lp = lpFilter(0.55);
    return { root: 440, data: drum(0.26, (t, _n, r) => 0.55 * Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t / 0.05) + 0.75 * lp(hp(r())) * Math.exp(-t / 0.075), 62) };
  },
  chimbal: () => {
    const hp = hpFilter(0.92);
    return { root: 440, data: drum(0.09, (t, _n, r) => hp(0.5 * r() + 0.6 * metal(t)) * Math.exp(-t / 0.018), 63) };
  },
  chimbalab: () => {
    const hp = hpFilter(0.92);
    return { root: 440, data: drum(0.45, (t, _n, r) => hp(0.5 * r() + 0.6 * metal(t)) * Math.exp(-t / 0.11), 64) };
  },
  prato: () => {
    const hp = hpFilter(0.85);
    return { root: 440, data: drum(1.4, (t, _n, r) => hp(0.6 * r() + 0.5 * metal(t * 0.8)) * Math.exp(-t / 0.42) * (0.6 + 0.4 * Math.exp(-t / 0.05)), 65) };
  },
  ride: () => {
    const hp = hpFilter(0.9);
    return { root: 440, data: drum(0.5, (t, _n, r) => hp(0.25 * r() + 0.7 * metal(t * 1.3)) * Math.exp(-t / 0.16), 66) };
  },
  tom: () => ({ root: 440, data: drum(0.4, (t, n, r) => {
    const ph = 2 * Math.PI * (95 * t + 70 * 0.06 * (1 - Math.exp(-t / 0.06)));
    return Math.sin(ph) * Math.exp(-t / 0.14) + (n < 96 ? r() * 0.25 * (1 - n / 96) : 0);
  }, 67) }),
  pandeiro: () => {
    const hp = hpFilter(0.95);
    return { root: 440, data: drum(0.22, (t, _n, r) => hp(r() * 0.6 + metal(t * 1.7) * 0.5) * (Math.exp(-t / 0.05) + 0.4 * Math.exp(-Math.abs(t - 0.04) / 0.02)), 68) };
  },
  conga: () => ({ root: 440, data: drum(0.3, (t, n, r) => {
    const ph = 2 * Math.PI * (300 * t + 40 * 0.02 * (1 - Math.exp(-t / 0.02)));
    return Math.sin(ph) * Math.exp(-t / 0.09) + (n < 48 ? r() * 0.3 * (1 - n / 48) : 0);
  }, 69) }),
};

export const INSTRUMENT_NAMES = Object.keys(RECIPES);

/** Suavização de 3 pontos: imita a interpolação dos chips de 16 bits (um pouco abafado). */
function soften(d: Float32Array): Float32Array {
  const o = new Float32Array(d.length);
  for (let i = 0; i < d.length; i++) {
    const a = d[i - 1] ?? d[d.length - 1];
    const c = d[i + 1] ?? d[0];
    o[i] = 0.2 * a + 0.6 * d[i] + 0.2 * c;
  }
  return o;
}

function normalize(d: Float32Array, peak = 0.9): void {
  let m = 0;
  for (const v of d) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < d.length; i++) d[i] *= peak / m;
}

const cache = new Map<string, Instrument>();

/** Gera (uma vez) e devolve o instrumento, já passado pelo codec de 4 bits. */
export function instrument(name: string): Instrument {
  const hit = cache.get(name);
  if (hit) return hit;
  const recipe = RECIPES[name];
  if (!recipe) throw new Error('instrumento desconhecido: ' + name);
  const raw = recipe();
  normalize(raw.data);
  // alinha o loop ao bloco do codec, como no hardware
  const enc = encode(raw.data);
  const data = soften(decode(enc, raw.data.length));
  const inst: Instrument = { name, data, root: raw.root, loopStart: raw.loopStart, loopEnd: raw.loopEnd, bytes: enc.length };
  cache.set(name, inst);
  return inst;
}
