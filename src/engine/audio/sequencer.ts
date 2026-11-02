/** Sequenciador: toca músicas escritas em formato texto tipo tracker. */
import { synth, midiFreq, noteToMidi, VOICES, SFX_VOICES, ECHO_DEFAULT, type Voice, type EchoParams } from './synth';

export interface Channel {
  voice: Voice;
  pattern: string;
  transpose?: number;
  vol?: number;
  /** canal de bateria: tokens k s h o c t */
  drums?: boolean;
  /** camada opcional, ligada/desligada em tempo real (ex.: 'ride' quando montada) */
  layer?: string;
  /** pan do canal, -1 (esquerda) a 1 (direita) */
  pan?: number;
  /** quanto do canal vai para o eco (0..1) */
  echo?: number;
}

export interface Song {
  name: string;
  bpm: number;
  /** passos por batida (padrão 4 = semicolcheias) */
  spb?: number;
  /** passo onde o loop recomeça após a intro */
  loopStart?: number;
  /** ganho da faixa inteira (mixagem: iguala o volume percebido entre as músicas) */
  gain?: number;
  /** eco da música (atraso, realimentação, retorno) */
  echo?: EchoParams;
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

/** Bateria: cada token toca um sample do kit, com afinação e volume próprios. */
interface DrumHit { inst: string; freq: number; vol: number; dur: number; pan?: number }
export const DRUM_KIT: Record<string, DrumHit> = {
  k: { inst: 'bumbo', freq: 440, vol: 1.0, dur: 0.3 },
  s: { inst: 'caixa', freq: 440, vol: 0.75, dur: 0.25 },
  h: { inst: 'chimbal', freq: 440, vol: 0.32, dur: 0.08, pan: 0.3 },
  o: { inst: 'chimbalab', freq: 440, vol: 0.3, dur: 0.4, pan: 0.3 },
  c: { inst: 'prato', freq: 440, vol: 0.4, dur: 1.3, pan: -0.25 },
  t: { inst: 'tom', freq: 520, vol: 0.8, dur: 0.35, pan: -0.2 },
  T: { inst: 'tom', freq: 380, vol: 0.85, dur: 0.38, pan: 0.2 },
  r: { inst: 'ride', freq: 440, vol: 0.26, dur: 0.45, pan: -0.3 },
  p: { inst: 'pandeiro', freq: 440, vol: 0.35, dur: 0.2, pan: 0.35 },
  g: { inst: 'conga', freq: 560, vol: 0.55, dur: 0.28, pan: 0.4 },
  G: { inst: 'conga', freq: 400, vol: 0.6, dur: 0.3, pan: -0.4 },
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
  private chNodes: GainNode[] = [];
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
    this.gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, song.gain ?? 1), c.currentTime + Math.max(0.01, fadeIn));
    this.gain.connect(synth.musicBus);
    synth.setEcho(song.echo ?? ECHO_DEFAULT);
    // cada canal tem seu volume, pan e envio de eco (como as vozes do chip)
    this.chNodes = song.channels.map((ch) => {
      const g = c.createGain();
      const pan = c.createStereoPanner();
      pan.pan.value = ch.pan ?? 0;
      g.connect(pan).connect(this.gain!);
      const e = c.createGain();
      e.gain.value = ch.echo ?? 0.5;
      g.connect(e).connect(synth.echoIn);
      return g;
    });
    this.startTime = c.currentTime + 0.08;
    this.nextStep = 0;
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), 60);
  }

  /** Agenda de uma vez os próximos `seconds` segundos (render offline, sem relógio da página). */
  scheduleAhead(seconds: number): void {
    const keep = this.lookahead;
    this.lookahead = seconds;
    this.schedule();
    this.lookahead = keep;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
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
      const nodes = this.chNodes;
      window.setTimeout(() => { g.disconnect(); for (const n of nodes) n.disconnect(); }, (fade + 0.1) * 1000);
    }
    this.gain = null;
    this.chNodes = [];
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
        // as duas últimas vozes do chip são emprestadas aos efeitos sonoros enquanto eles tocam
        if (ci >= VOICES - SFX_VOICES && synth.sfxBusyUntil > when) return;
        const dest = this.chNodes[ci] ?? this.gain!;
        const p = this.parsed[ci];
        const local = pos % p.length;
        for (const ev of p.events) {
          if (ev.step !== local) continue;
          if (ev.drum) {
            const d = DRUM_KIT[ev.drum];
            if (!d) continue;
            synth.note({ freq: d.freq, dur: d.dur, when, voice: { inst: d.inst, a: 0.001, d: d.dur, s: 1, r: 0.02, vol: d.vol, pan: d.pan }, vol: ch.vol ?? 1, dest });
          } else {
            const dur = Math.max(0.02, ev.len * this.stepDur - 0.01);
            synth.note({ freq: midiFreq(ev.midi), dur, when, voice: ch.voice, vol: ch.vol ?? 1, dest });
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
