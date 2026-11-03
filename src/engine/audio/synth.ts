/**
 * Chip de som do console virtual, sobre Web Audio.
 *
 * Toca samples do banco (`instruments.ts`) com envelope ADSR, pan, vibrato e slides, e mantém um
 * barramento de eco com realimentação filtrada, como os chips de 16 bits. As ondas simples
 * (pulso, triângulo, serra, ruído) continuam disponíveis só como reserva.
 */
import { instrument, INSTRUMENT_NAMES } from './instruments';

export type Wave = 'p12' | 'p25' | 'p50' | 'tri' | 'saw' | 'noise' | 'sine';

export interface Voice {
  /** onda sintética (reserva); ignorada quando `inst` está definido */
  wave?: Wave;
  /** instrumento do banco de samples */
  inst?: string;
  /** pan fixo da voz, -1..1 */
  pan?: number;
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
  /** envio para o eco (0..1); só vale quando dest é o barramento padrão */
  echo?: number;
}

/** Parâmetros do eco de uma música. */
export interface EchoParams {
  /** atraso em segundos (até 0,24) */
  delay: number;
  /** realimentação 0..0,7 */
  feedback: number;
  /** volume do retorno */
  mix: number;
  /** corte do filtro no laço, Hz */
  tone?: number;
}

export const ECHO_DEFAULT: EchoParams = { delay: 0.18, feedback: 0.38, mix: 0.32, tone: 3200 };

/** Número de vozes do chip. Os efeitos sonoros usam as duas últimas, como no hardware. */
export const VOICES = 8;
export const SFX_VOICES = 2;

export class Synth {
  ctx: BaseAudioContext | null = null;
  master!: GainNode;
  musicBus!: GainNode;
  sfxBus!: GainNode;
  musicFilter!: BiquadFilterNode;
  private waves = new Map<Wave, PeriodicWave>();
  private noiseBuf: AudioBuffer | null = null;
  private buffers = new Map<string, AudioBuffer>();
  echoIn!: GainNode;
  private echoDelay!: DelayNode;
  private echoFb!: GainNode;
  private echoTone!: BiquadFilterNode;
  private echoOut!: GainNode;
  /** até quando os efeitos sonoros ocupam as vozes 7 e 8 (tempo do AudioContext) */
  sfxBusyUntil = 0;
  musicVol = 0.7;
  sfxVol = 0.8;
  private unlocked = false;
  private preloading = false;

  /** Deve ser chamado dentro de um gesto do usuário. */
  unlock(): void {
    if (this.unlocked) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.attach(new Ctor());
    // o banco de samples nasce num worker; render offline (attach direto) gera por demanda
    this.preloadAll();
  }

  /** Liga o chip a um contexto de áudio (o da página ou um OfflineAudioContext para renderizar em arquivo). */
  attach(c: BaseAudioContext): void {
    this.ctx = c;
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
    // eco: entrada -> atraso -> filtro -> (realimentação) ; saída no barramento de música
    this.echoIn = c.createGain();
    this.echoDelay = c.createDelay(0.5);
    this.echoTone = c.createBiquadFilter();
    this.echoTone.type = 'lowpass';
    this.echoFb = c.createGain();
    this.echoOut = c.createGain();
    this.echoIn.connect(this.echoDelay);
    this.echoDelay.connect(this.echoTone);
    this.echoTone.connect(this.echoFb).connect(this.echoDelay);
    this.echoTone.connect(this.echoOut).connect(this.musicBus);
    this.setEcho(ECHO_DEFAULT);
    this.buildWaves();
    this.unlocked = true;
    if (c instanceof AudioContext && c.state === 'suspended') void c.resume();
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
  /** Configura o eco (cada música tem o seu). */
  setEcho(e: EchoParams): void {
    if (!this.ctx) return;
    const t = this.now;
    this.echoDelay.delayTime.setTargetAtTime(Math.min(0.24, Math.max(0.016, e.delay)), t, 0.02);
    this.echoFb.gain.setTargetAtTime(Math.min(0.7, Math.max(0, e.feedback)), t, 0.02);
    this.echoOut.gain.setTargetAtTime(Math.max(0, e.mix), t, 0.02);
    this.echoTone.frequency.setTargetAtTime(e.tone ?? 3200, t, 0.02);
  }

  /** Dados de loop e afinação dos instrumentos já prontos (do worker ou da geração local). */
  private instMeta = new Map<string, { root: number; loopStart?: number; loopEnd?: number }>();

  /** Buffer + metadados de um instrumento. Se o worker ainda não entregou, gera na hora (raro). */
  ensure(name: string): { buf: AudioBuffer; root: number; loopStart?: number; loopEnd?: number } | null {
    const c = this.ctx;
    if (!c) return null;
    const hit = this.buffers.get(name);
    const meta = this.instMeta.get(name);
    if (hit && meta) return { buf: hit, ...meta };
    const inst = instrument(name);
    const b = c.createBuffer(1, inst.data.length, 32000);
    b.getChannelData(0).set(inst.data);
    const m = { root: inst.root, loopStart: inst.loopStart, loopEnd: inst.loopEnd };
    this.buffers.set(name, b);
    this.instMeta.set(name, m);
    return { buf: b, ...m };
  }

  /**
   * Sintetiza o banco inteiro num Web Worker: a thread principal (jogo e agendamento de notas)
   * não trava enquanto os samples nascem. Sem worker (testes, render offline), cai no modo
   * preguiçoso: `ensure` gera cada instrumento na primeira nota.
   */
  private preloadAll(): void {
    if (this.preloading || typeof Worker === 'undefined') return;
    this.preloading = true;
    // os mais urgentes primeiro: efeitos de menu/jogo e o kit de bateria, depois o resto
    const first = ['blip', 'suave', 'ruido', 'celesta', 'sino', 'bumbo', 'caixa', 'chimbal', 'chimbalab', 'ride', 'steel', 'marimba', 'slap', 'flauta', 'baixo', 'pizz', 'harpa'];
    const names = [...first, ...INSTRUMENT_NAMES.filter((n) => !first.includes(n))];
    try {
      const w = new Worker(new URL('./instrumentWorker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<{ name: string; data: Float32Array; root: number; loopStart?: number; loopEnd?: number }>) => {
        const { name, data, root, loopStart, loopEnd } = e.data;
        const c = this.ctx;
        if (!c || this.buffers.has(name)) return;
        const b = c.createBuffer(1, data.length, 32000);
        b.getChannelData(0).set(data);
        this.buffers.set(name, b);
        this.instMeta.set(name, { root, loopStart, loopEnd });
        if (this.buffers.size >= names.length) {
          this.preloading = false;
          w.terminate();
        }
      };
      w.onerror = () => {
        // worker indisponível (ex.: file:// sem suporte): volta ao modo preguiçoso
        this.preloading = false;
        w.terminate();
      };
      w.postMessage(names.filter((n) => !this.buffers.has(n)));
      // cinto de segurança: se nada chegar, reabilita a geração preguiçosa
      setTimeout(() => {
        if (this.buffers.size === 0) this.preloading = false;
      }, 4000);
    } catch {
      this.preloading = false;
    }
  }

  /** Filtro "debaixo d'água" para a música. Só agenda quando o estado muda (é chamado todo frame). */
  private underwater = false;
  setUnderwater(on: boolean): void {
    if (on === this.underwater) return;
    this.underwater = on;
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
    let out: AudioNode = last;
    const pan = v.pan ?? 0;
    if (pan !== 0) {
      const p = c.createStereoPanner();
      p.pan.value = pan;
      last.connect(p);
      out = p;
    }
    out.connect(dest);
    if (!o.dest) {
      // efeito sonoro: ocupa as vozes reservadas e pode mandar um pouco para o eco
      this.sfxBusyUntil = Math.max(this.sfxBusyUntil, stopAt);
      if (o.echo) {
        const e = c.createGain();
        e.gain.value = o.echo;
        out.connect(e).connect(this.echoIn);
      }
    }

    if (v.inst) {
      // enquanto o worker sintetiza o banco, nota de instrumento ausente é pulada em vez de
      // gerada na hora (gerar aqui travaria o quadro; a voz entra sozinha em <1 s)
      if (this.preloading && !this.buffers.has(v.inst)) {
        gain.disconnect();
        return stopAt;
      }
      const got = this.ensure(v.inst);
      if (!got) return stopAt;
      const src = c.createBufferSource();
      src.buffer = got.buf;
      if (got.loopStart !== undefined && got.loopEnd !== undefined) {
        src.loop = true;
        src.loopStart = got.loopStart / 32000;
        src.loopEnd = got.loopEnd / 32000;
      }
      const rate = (f: number): number => Math.max(0.01, f / got.root);
      src.playbackRate.setValueAtTime(rate(o.freq), t0);
      if (o.slideTo) src.playbackRate.exponentialRampToValueAtTime(rate(o.slideTo), t0 + (o.slideTime ?? o.dur));
      if (v.detune) src.detune.value = v.detune;
      if (v.vibDepth && v.vibRate) {
        const lfo = c.createOscillator();
        lfo.frequency.value = v.vibRate;
        const lg = c.createGain();
        // vibrato entra depois de um instante, como nos arranjos da época
        lg.gain.setValueAtTime(0, t0);
        lg.gain.linearRampToValueAtTime(v.vibDepth, t0 + Math.min(0.25, o.dur * 0.6));
        lfo.connect(lg).connect(src.detune);
        lfo.start(t0);
        lfo.stop(stopAt);
      }
      src.connect(gain);
      src.start(t0);
      src.stop(stopAt);
      return stopAt;
    }

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
    else osc.setPeriodicWave(this.waves.get(v.wave ?? 'p50')!);
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
