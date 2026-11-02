/** Sequenciador: toca músicas escritas em formato texto tipo tracker. */
import { synth, midiFreq, noteToMidi, type Voice } from './synth';

export interface Channel {
  voice: Voice;
  pattern: string;
  transpose?: number;
  vol?: number;
  /** canal de bateria: tokens k s h o c t */
  drums?: boolean;
  /** camada opcional, ligada/desligada em tempo real (ex.: 'ride' quando montada) */
  layer?: string;
}

export interface Song {
  name: string;
  bpm: number;
  /** passos por batida (padrão 4 = semicolcheias) */
  spb?: number;
  /** passo onde o loop recomeça após a intro */
  loopStart?: number;
  channels: Channel[];
}

interface Event {
  step: number;
  midi: number;
  len: number; // em passos
  drum?: string;
}

interface Parsed {
  events: Event[];
  length: number;
}

const DRUM_VOICES: Record<string, { voice: Voice; freq: number; slideTo?: number; dur: number }> = {
  k: { voice: { wave: 'tri', a: 0.001, d: 0.08, s: 0, r: 0.03, vol: 1.0 }, freq: 160, slideTo: 40, dur: 0.1 },
  s: { voice: { wave: 'noise', a: 0.001, d: 0.1, s: 0, r: 0.05, vol: 0.5, lp: 4000 }, freq: 900, slideTo: 300, dur: 0.12 },
  h: { voice: { wave: 'noise', a: 0.001, d: 0.03, s: 0, r: 0.01, vol: 0.25 }, freq: 6000, dur: 0.03 },
  o: { voice: { wave: 'noise', a: 0.001, d: 0.12, s: 0, r: 0.05, vol: 0.22 }, freq: 7000, dur: 0.15 },
  c: { voice: { wave: 'noise', a: 0.001, d: 0.5, s: 0, r: 0.2, vol: 0.3 }, freq: 5000, slideTo: 2000, dur: 0.5 },
  t: { voice: { wave: 'tri', a: 0.001, d: 0.12, s: 0, r: 0.03, vol: 0.8 }, freq: 240, slideTo: 90, dur: 0.14 },
  r: { voice: { wave: 'noise', a: 0.001, d: 0.06, s: 0, r: 0.02, vol: 0.18, lp: 9000 }, freq: 9000, dur: 0.06 },
};

function tokenize(p: string): string[] {
  return p.replace(/\|/g, ' ').split(/\s+/).filter((t) => t.length > 0);
}

export function parsePattern(pattern: string, drums = false, transpose = 0): Parsed {
  const toks = tokenize(pattern);
  const events: Event[] = [];
  let cur: Event | null = null;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === '.') {
      cur = null;
      continue;
    }
    if (t === '-') {
      if (cur) cur.len++;
      continue;
    }
    if (drums) {
      cur = { step: i, midi: 0, len: 1, drum: t };
      events.push(cur);
      continue;
    }
    cur = { step: i, midi: noteToMidi(t) + transpose, len: 1 };
    events.push(cur);
  }
  return { events, length: toks.length };
}

export class Sequencer {
  private song: Song | null = null;
  private parsed: Parsed[] = [];
  private stepDur = 0;
  private songLength = 0;
  private startTime = 0;
  private nextStep = 0;
  private timer: number | null = null;
  private gain: GainNode | null = null;
  private layers = new Set<string>();
  private lookahead = 0.25;
  private pendingStop = false;
  currentName = '';

  get playing(): boolean {
    return this.song !== null && !this.pendingStop;
  }

  setLayer(name: string, on: boolean): void {
    if (on) this.layers.add(name);
    else this.layers.delete(name);
  }

  play(song: Song, fadeIn = 0.02): void {
    if (!synth.ready) return;
    if (this.song === song && !this.pendingStop) return;
    this.stop(0.05);
    const c = synth.ctx!;
    this.song = song;
    this.pendingStop = false;
    this.currentName = song.name;
    const spb = song.spb ?? 4;
    this.stepDur = 60 / song.bpm / spb;
    this.parsed = song.channels.map((ch) => parsePattern(ch.pattern, ch.drums, ch.transpose ?? 0));
    this.songLength = Math.max(...this.parsed.map((p) => p.length));
    this.gain = c.createGain();
    this.gain.gain.setValueAtTime(0.0001, c.currentTime);
    this.gain.gain.exponentialRampToValueAtTime(1, c.currentTime + Math.max(0.01, fadeIn));
    this.gain.connect(synth.musicBus);
    this.startTime = c.currentTime + 0.08;
    this.nextStep = 0;
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), 60);
  }

  stop(fade = 0.3): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.gain && synth.ctx) {
      const g = this.gain;
      const t = synth.ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.01, fade));
      window.setTimeout(() => g.disconnect(), (fade + 0.1) * 1000);
    }
    this.gain = null;
    this.song = null;
    this.pendingStop = true;
    this.currentName = '';
  }

  private schedule(): void {
    const c = synth.ctx;
    if (!c || !this.song || !this.gain) return;
    const horizon = c.currentTime + this.lookahead;
    while (this.startTime + this.nextStep * this.stepDur < horizon) {
      const step = this.nextStep;
      const when = this.startTime + step * this.stepDur;
      // posição dentro da música considerando loop
      const pos = this.songPos(step);
      this.song.channels.forEach((ch, ci) => {
        if (ch.layer && !this.layers.has(ch.layer)) return;
        const p = this.parsed[ci];
        const local = pos % p.length;
        for (const ev of p.events) {
          if (ev.step !== local) continue;
          if (ev.drum) {
            const d = DRUM_VOICES[ev.drum];
            if (!d) continue;
            synth.note({ freq: d.freq, slideTo: d.slideTo, slideTime: d.dur, dur: d.dur, when, voice: d.voice, vol: ch.vol ?? 1, dest: this.gain! });
          } else {
            const dur = Math.max(0.02, ev.len * this.stepDur - 0.01);
            synth.note({ freq: midiFreq(ev.midi), dur, when, voice: ch.voice, vol: ch.vol ?? 1, dest: this.gain! });
          }
        }
      });
      this.nextStep++;
    }
  }

  private songPos(step: number): number {
    const L = this.songLength;
    if (step < L) return step;
    const ls = this.song?.loopStart ?? 0;
    const loopLen = Math.max(1, L - ls);
    return ls + ((step - L) % loopLen);
  }
}

export const sequencer = new Sequencer();
