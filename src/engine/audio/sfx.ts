/** Efeitos sonoros gerados por parâmetros. */
import { synth, type Voice } from './synth';

type SfxFn = (t: number) => void;

// Efeitos tocados pelo chip de samples (vozes 7 e 8), com um pouco de eco.
const P: Voice = { inst: 'blip', a: 0.002, d: 0.05, s: 0.7, r: 0.05, vol: 0.5 };
const P25: Voice = { ...P, inst: 'suave', vol: 0.6 };
const P12: Voice = { ...P, inst: 'blip', vol: 0.42 };
const TRI: Voice = { inst: 'suave', a: 0.002, d: 0.05, s: 0.75, r: 0.06, vol: 0.75 };
const NOISE: Voice = { inst: 'ruido', a: 0.001, d: 0.08, s: 0.3, r: 0.08, vol: 0.45 };
const BELL: Voice = { inst: 'celesta', a: 0.001, d: 0.2, s: 0.8, r: 0.25, vol: 0.75 };

function n(freq: number, dur: number, t: number, voice: Voice, slideTo?: number, vol = 1): void {
  synth.note({ freq, dur, when: t, voice, slideTo, slideTime: dur, vol, echo: 0.18 });
}

export const SFX: Record<string, SfxFn> = {
  jump: (t) => n(300, 0.12, t, P25, 620, 0.7),
  spin: (t) => { n(400, 0.08, t, P12, 800, 0.5); n(500, 0.08, t + 0.06, P12, 900, 0.5); },
  stomp: (t) => { n(220, 0.08, t, P50_(), 90, 0.8); n(1200, 0.05, t, NOISE, 300, 0.5); },
  bounce: (t) => n(260, 0.1, t, P25, 700, 0.6),
  amber: (t) => { n(1245, 0.06, t, BELL, undefined, 0.55); n(1661, 0.16, t + 0.06, BELL, undefined, 0.6); },
  pearl: (t) => [0, 0.08, 0.16, 0.24].forEach((d, i) => n([880, 1109, 1319, 1760][i], 0.18, t + d, BELL, undefined, 0.7)),
  powerup: (t) => [0, 0.07, 0.14, 0.21, 0.28, 0.35].forEach((d, i) => n([523, 659, 784, 1047, 1319, 1568][i], 0.1, t + d, P25, undefined, 0.6)),
  oneup: (t) => [0, 0.1, 0.2, 0.3, 0.4].forEach((d, i) => n([659, 784, 1319, 1047, 1568][i], 0.14, t + d, P50_(), undefined, 0.6)),
  hurt: (t) => { n(400, 0.25, t, P50_(), 120, 0.8); n(600, 0.2, t, NOISE, 200, 0.4); },
  die: (t) => { [0, 0.12, 0.24, 0.36].forEach((d, i) => n([440, 349, 294, 220][i], 0.14, t + d, P50_(), undefined, 0.7)); n(200, 0.6, t + 0.5, P50_(), 60, 0.7); },
  blockhit: (t) => n(300, 0.06, t, P50_(), 200, 0.6),
  blockbreak: (t) => { n(800, 0.15, t, NOISE, 200, 0.6); n(180, 0.1, t, TRI, 80, 0.6); },
  item: (t) => { n(600, 0.06, t, P25, 900, 0.5); n(900, 0.08, t + 0.06, P25, 1200, 0.5); },
  skid: (t) => n(2000, 0.12, t, NOISE, 800, 0.3),
  kick: (t) => { n(500, 0.08, t, P12, 150, 0.6); n(900, 0.06, t, NOISE, 300, 0.4); },
  throw_: (t) => n(300, 0.1, t, P25, 600, 0.5),
  splash: (t) => { n(1800, 0.25, t, NOISE, 400, 0.5); n(500, 0.1, t, TRI, 200, 0.3); },
  swim: (t) => n(900, 0.08, t, NOISE, 400, 0.25),
  checkpoint: (t) => [0, 0.12, 0.24].forEach((d, i) => n([784, 988, 1175][i], 0.3, t + d, BELL, undefined, 0.7)),
  goal: (t) => [0, 0.1, 0.2, 0.3, 0.45, 0.6].forEach((d, i) => n([523, 659, 784, 1047, 784, 1047][i], 0.18, t + d, P25, undefined, 0.6)),
  pause: (t) => { n(880, 0.06, t, P50_(), undefined, 0.5); n(1320, 0.1, t + 0.07, P50_(), undefined, 0.5); },
  menu: (t) => n(1000, 0.05, t, P25, undefined, 0.4),
  select: (t) => { n(800, 0.06, t, P25, undefined, 0.5); n(1200, 0.1, t + 0.06, P25, undefined, 0.5); },
  mount: (t) => { n(300, 0.08, t, TRI, 500, 0.7); n(500, 0.12, t + 0.08, TRI, 700, 0.7); },
  roll: (t) => n(300, 0.1, t, NOISE, 120, 0.3),
  flee: (t) => [0, 0.06, 0.12].forEach((d, i) => n([700, 600, 500][i], 0.06, t + d, TRI, undefined, 0.6)),
  shoot: (t) => n(1200, 0.1, t, P12, 400, 0.5),
  bosshit: (t) => { n(200, 0.3, t, P50_(), 60, 0.9); n(1500, 0.2, t, NOISE, 200, 0.6); },
  bossdie: (t) => { for (let i = 0; i < 6; i++) { n(400 - i * 40, 0.2, t + i * 0.12, NOISE, 80, 0.6); n(300 - i * 30, 0.15, t + i * 0.12, P50_(), 60, 0.6); } },
  wind: (t) => n(1200, 0.5, t, { ...NOISE, lp: 1500, a: 0.1 }, 600, 0.25),
  warp: (t) => [0, 0.08, 0.16, 0.24, 0.32].forEach((d, i) => n(300 + i * 150, 0.1, t + d, P25, 300 + i * 150 + 200, 0.5)),
  text: (t) => n(1400, 0.03, t, P12, undefined, 0.25),
  door: (t) => { n(150, 0.2, t, TRI, 100, 0.6); n(600, 0.15, t, NOISE, 200, 0.3); },
  mapstep: (t) => n(500, 0.05, t, TRI, 400, 0.3),
  mapclear: (t) => [0, 0.1, 0.2, 0.3].forEach((d, i) => n([523, 659, 784, 1047][i], 0.2, t + d, BELL, undefined, 0.6)),
  reveal: (t) => [0, 0.05, 0.1].forEach((d, i) => n([1000, 1400, 2000][i], 0.1, t + d, P12, undefined, 0.4)),
  tide: (t) => n(300, 0.8, t, { ...NOISE, lp: 900, a: 0.2 }, 200, 0.3),
  bell: (t) => { n(1319, 0.6, t, { ...BELL, inst: 'sino' }, undefined, 0.8); },
  gust: (t) => n(900, 0.3, t, { ...NOISE, lp: 2500 }, 1600, 0.3),
  cannon: (t) => { n(100, 0.3, t, NOISE, 40, 0.8); n(120, 0.2, t, TRI, 50, 0.8); },
  ink: (t) => n(300, 0.15, t, { ...NOISE, lp: 1200 }, 100, 0.5),
  dig: (t) => n(600, 0.1, t, { ...NOISE, lp: 2000 }, 200, 0.4),
  inflate: (t) => n(200, 0.4, t, P12, 600, 0.4),
  pop: (t) => { n(800, 0.05, t, P50_(), 200, 0.7); n(2000, 0.08, t, NOISE, 500, 0.5); },
  lantern: (t) => { n(1500, 0.1, t, TRI, 2200, 0.5); },
  fire: (t) => n(800, 0.3, t, { ...NOISE, lp: 3000, a: 0.05 }, 300, 0.35),
  minecart: (t) => n(400, 0.1, t, { ...NOISE, lp: 1800 }, 300, 0.25),
};

function P50_(): Voice {
  return P;
}

const lastPlayed = new Map<string, number>();

/** Toca um efeito; evita repetição no mesmo frame. */
export function sfx(name: string): void {
  if (!synth.ready) return;
  const fn = SFX[name];
  if (!fn) return;
  const t = synth.now;
  const last = lastPlayed.get(name) ?? -1;
  if (t - last < 0.03) return;
  lastPlayed.set(name, t);
  fn(t);
}
