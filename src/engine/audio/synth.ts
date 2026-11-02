/** Sintetizador por Web Audio: ondas pulsadas, triângulo, serra, ruído; envelopes ADSR; slides. */

export type Wave = 'p12' | 'p25' | 'p50' | 'tri' | 'saw' | 'noise' | 'sine';

export interface Voice {
  wave: Wave;
  /** envelope em segundos */
  a: number;
  d: number;
  s: number; // nível de sustain 0..1
  r: number;
  vol: number;
  /** vibrato: profundidade em cents e taxa em Hz */
  vibDepth?: number;
  vibRate?: number;
  /** desafinação em cents */
  detune?: number;
  /** filtro passa-baixa opcional (Hz) */
  lp?: number;
}

export interface NoteOpts {
  freq: number;
  dur: number; // duração em segundos até o release
  when: number; // tempo no AudioContext
  voice: Voice;
  /** slide: frequência final e tempo */
  slideTo?: number;
  slideTime?: number;
  vol?: number;
  dest?: AudioNode;
}

export class Synth {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicBus!: GainNode;
  sfxBus!: GainNode;
  musicFilter!: BiquadFilterNode;
  private waves = new Map<Wave, PeriodicWave>();
  private noiseBuf: AudioBuffer | null = null;
  musicVol = 0.7;
  sfxVol = 0.8;
  private unlocked = false;

  /** Deve ser chamado dentro de um gesto do usuário. */
  unlock(): void {
    if (this.unlocked) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(c.destination);
    this.musicFilter = c.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 20000;
    this.musicBus = c.createGain();
    this.musicBus.gain.value = this.musicVol;
    this.musicBus.connect(this.musicFilter).connect(this.master);
    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);
    this.buildWaves();
    this.unlocked = true;
    if (c.state === 'suspended') void c.resume();
  }

  get ready(): boolean {
    return this.unlocked && !!this.ctx;
  }

  get now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  setMusicVolume(v: number): void {
    this.musicVol = v;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(v, this.now, 0.05);
  }
  setSfxVolume(v: number): void {
    this.sfxVol = v;
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(v, this.now, 0.05);
  }
  /** Filtro "debaixo d'água" para a música. */
  setUnderwater(on: boolean): void {
    if (this.musicFilter) this.musicFilter.frequency.setTargetAtTime(on ? 700 : 20000, this.now, 0.1);
  }

  private buildWaves(): void {
    const c = this.ctx!;
    const N = 32;
    const pulse = (duty: number): PeriodicWave => {
      const real = new Float32Array(N), imag = new Float32Array(N);
      for (let n = 1; n < N; n++) {
        // série de Fourier de onda pulsada com duty d: a_n = (2/(nπ)) sin(nπd)
        real[n] = 0;
        imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
      }
      return c.createPeriodicWave(real, imag, { disableNormalization: false });
    };
    this.waves.set('p12', pulse(0.125));
    this.waves.set('p25', pulse(0.25));
    this.waves.set('p50', pulse(0.5));
    // ruído branco de 1 s
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = buf.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < d.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      d[i] = (seed / 0x7fffffff) * 2 - 1;
    }
    this.noiseBuf = buf;
  }

  /** Toca uma nota. Retorna o tempo em que termina (com release). */
  note(o: NoteOpts): number {
    const c = this.ctx;
    if (!c) return 0;
    const v = o.voice;
    const dest = o.dest ?? this.sfxBus;
    const vol = (o.vol ?? 1) * v.vol;
    const t0 = Math.max(o.when, c.currentTime);
    const tEnd = t0 + o.dur;
    const gain = c.createGain();
    const g = gain.gain;
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(vol, t0 + Math.max(0.001, v.a));
    const decEnd = t0 + v.a + v.d;
    g.linearRampToValueAtTime(vol * v.s, Math.max(decEnd, t0 + v.a + 0.001));
    g.setValueAtTime(vol * v.s, Math.max(tEnd, decEnd));
    g.exponentialRampToValueAtTime(0.0001, Math.max(tEnd, decEnd) + Math.max(0.005, v.r));
    const stopAt = Math.max(tEnd, decEnd) + Math.max(0.005, v.r) + 0.02;

    let last: AudioNode = gain;
    if (v.lp) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = v.lp;
      gain.connect(f);
      last = f;
    }
    last.connect(dest);

    if (v.wave === 'noise') {
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      // "afinação" do ruído via playbackRate
      src.playbackRate.setValueAtTime(Math.max(0.05, o.freq / 440), t0);
      if (o.slideTo) src.playbackRate.linearRampToValueAtTime(Math.max(0.05, o.slideTo / 440), t0 + (o.slideTime ?? o.dur));
      src.connect(gain);
      src.start(t0);
      src.stop(stopAt);
      return stopAt;
    }
    const osc = c.createOscillator();
    if (v.wave === 'tri') osc.type = 'triangle';
    else if (v.wave === 'saw') osc.type = 'sawtooth';
    else if (v.wave === 'sine') osc.type = 'sine';
    else osc.setPeriodicWave(this.waves.get(v.wave)!);
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slideTo), t0 + (o.slideTime ?? o.dur));
    if (v.detune) osc.detune.value = v.detune;
    if (v.vibDepth && v.vibRate) {
      const lfo = c.createOscillator();
      lfo.frequency.value = v.vibRate;
      const lg = c.createGain();
      lg.gain.value = v.vibDepth;
      lfo.connect(lg).connect(osc.detune);
      lfo.start(t0);
      lfo.stop(stopAt);
    }
    osc.connect(gain);
    osc.start(t0);
    osc.stop(stopAt);
    return stopAt;
  }
}

/** Frequência de uma nota MIDI. */
export function midiFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

const NOTE_IDX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "C4", "F#3", "Bb5" -> MIDI */
export function noteToMidi(n: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) throw new Error('nota inválida: ' + n);
  let v = NOTE_IDX[m[1]];
  if (m[2] === '#') v++;
  if (m[2] === 'b') v--;
  return v + (parseInt(m[3], 10) + 1) * 12;
}

export const synth = new Synth();
