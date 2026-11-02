/**
 * Trilha sonora original, em formato tracker:
 * cada token é uma semicolcheia; '.' pausa, '-' prolonga a nota anterior; '|' só separa compassos.
 */
import type { Song, Channel } from '../../engine/audio/sequencer';
import type { Voice, EchoParams } from '../../engine/audio/synth';

const LEAD: Voice = { wave: 'p25', a: 0.005, d: 0.08, s: 0.55, r: 0.08, vol: 0.5, vibDepth: 6, vibRate: 5.5 };
const LEAD_SOFT: Voice = { wave: 'tri', a: 0.01, d: 0.1, s: 0.7, r: 0.15, vol: 0.6, vibDepth: 8, vibRate: 5 };
const LEAD_SQ: Voice = { wave: 'p50', a: 0.005, d: 0.06, s: 0.5, r: 0.06, vol: 0.4 };
const HARM: Voice = { wave: 'p12', a: 0.005, d: 0.1, s: 0.4, r: 0.1, vol: 0.3 };
const PAD: Voice = { wave: 'p50', a: 0.08, d: 0.2, s: 0.6, r: 0.3, vol: 0.18, lp: 1800 };
const BASS: Voice = { wave: 'tri', a: 0.005, d: 0.08, s: 0.8, r: 0.06, vol: 0.9 };
const BASS_SAW: Voice = { wave: 'saw', a: 0.005, d: 0.1, s: 0.6, r: 0.06, vol: 0.35, lp: 900 };
const ARP: Voice = { wave: 'p12', a: 0.002, d: 0.05, s: 0.3, r: 0.05, vol: 0.28 };
const BELLV: Voice = { wave: 'sine', a: 0.002, d: 0.3, s: 0.2, r: 0.3, vol: 0.5 };

const x = (s: string, n: number): string => Array(n).fill(s).join(' | ');

function ch(voice: Voice, pattern: string, extra: Partial<Channel> = {}): Channel {
  return { voice, pattern, ...extra };
}
function drums(pattern: string, extra: Partial<Channel> = {}): Channel {
  return { voice: BASS, pattern, drums: true, ...extra };
}

// padrões de bateria reutilizáveis (16 passos)
const D_POP = 'k . h . s . h . k . h k s . h .';
const D_CALYPSO = 'k . h h s . h . . k h . s . h h';
const D_MARCH = 'k . . . s . . . k . k . s . . h';
const D_SOFT = 'k . . . r . . . . . k . r . . .';
const D_RIDE = 'r . r . r . r . r . r . r . r .';
const D_BOSS = 'k k . s . k s . k k . s . k s s';

export const MUSIC: Record<string, Song> = {
  titulo: {
    name: 'titulo',
    bpm: 112,
    channels: [
      ch(LEAD_SOFT, [
        'E5 - - - G5 - - - C6 - - - - - - -', 'B5 - - - G5 - - - E5 - - - - - - -',
        'D5 - - - F5 - - - A5 - - - - - - -', 'G5 - - - - - - - E5 - - - - - - -',
        'E5 - - - G5 - - - C6 - - - - - - -', 'D6 - - - B5 - - - G5 - - - - - - -',
        'A5 - - - G5 - - - F5 - - - D5 - - -', 'E5 - - - - - - - - - - - - - - -',
      ].join(' | ')),
      ch(ARP, x('C4 E4 G4 C5 G4 E4 C4 E4 G4 C5 G4 E4 C4 E4 G4 C5', 2) + ' | ' + x('F4 A4 C5 F5 C5 A4 F4 A4 G4 B4 D5 G5 D5 B4 G4 B4', 1) + ' | ' + x('C4 E4 G4 C5 G4 E4 C4 E4 G4 C5 G4 E4 C4 E4 G4 C5', 1) + ' | ' + x('C4 E4 G4 C5 G4 E4 C4 E4 G4 B4 D5 G5 D5 B4 G4 B4', 1) + ' | ' + x('F4 A4 C5 F5 C5 A4 F4 A4 G4 B4 D5 G5 D5 B4 G4 B4', 1) + ' | ' + x('C4 E4 G4 C5 G4 E4 C4 E4 C4 E4 G4 C5 G4 E4 C4 E4', 2)),
      ch(BASS, x('C3 - - - - - - - C3 - - - - - - -', 2) + ' | F2 - - - - - - - G2 - - - - - - - | ' + x('C3 - - - - - - - C3 - - - - - - -', 1) + ' | C3 - - - - - - - G2 - - - - - - - | F2 - - - - - - - G2 - - - - - - - | ' + x('C3 - - - - - - - C3 - - - - - - -', 2)),
      drums(x(D_SOFT, 8)),
    ],
  },

  mapa: {
    name: 'mapa',
    bpm: 120,
    channels: [
      ch(LEAD, [
        'G4 - A4 - C5 - - - D5 - - - C5 - A4 -', 'G4 - - - - - - - . . . . . . . .',
        'A4 - C5 - D5 - - - E5 - - - D5 - C5 -', 'A4 - - - - - - - . . . . . . . .',
        'G4 - A4 - C5 - - - D5 - - - E5 - G5 -', 'E5 - - - D5 - - - C5 - - - - - - -',
        'A4 - - - C5 - - - D5 - C5 - A4 - G4 -', 'C5 - - - - - - - . . . . . . . .',
      ].join(' | ')),
      ch(PAD, 'C4 - - - - - - - - - - - - - - - | - - - - - - - - - - - - - - - - | F4 - - - - - - - - - - - - - - - | - - - - - - - - - - - - - - - - | C4 - - - - - - - - - - - - - - - | - - - - - - - - - - - - - - - - | F4 - - - - - - - G4 - - - - - - - | C4 - - - - - - - - - - - - - - -'),
      ch(BASS, x('C3 . . C3 . . G2 . C3 . . C3 . . G2 .', 2) + ' | ' + x('F2 . . F2 . . C3 . F2 . . F2 . . C3 .', 2) + ' | ' + x('C3 . . C3 . . G2 . C3 . . C3 . . G2 .', 2) + ' | F2 . . F2 . . C3 . G2 . . G2 . . D3 . | C3 . . C3 . . G2 . C3 . . . . . . .'),
      drums(x(D_SOFT, 8)),
    ],
  },

  praia: {
    name: 'praia',
    bpm: 132,
    channels: [
      ch(LEAD, [
        'E5 - - G5 - - E5 - C5 - - - D5 - E5 -', 'D5 - - F5 - - D5 - B4 - - - - - - -',
        'E5 - - G5 - - E5 - C5 - - - D5 - E5 -', 'G5 - - A5 - - G5 - E5 - - - - - - -',
        'A5 - - G5 - - E5 - D5 - - - E5 - D5 -', 'C5 - - E5 - - G5 - A5 - - - - - - -',
        'G5 - - E5 - - D5 - C5 - - - D5 - E5 -', 'C5 - - - - - - - . . . . . . . .',
      ].join(' | ')),
      ch(HARM, [
        'C4 . E4 . G4 . E4 . C4 . E4 . G4 . E4 .', 'B3 . D4 . G4 . D4 . B3 . D4 . G4 . D4 .',
        'C4 . E4 . G4 . E4 . C4 . E4 . G4 . E4 .', 'C4 . E4 . G4 . E4 . C4 . E4 . G4 . E4 .',
        'F4 . A4 . C5 . A4 . F4 . A4 . C5 . A4 .', 'C4 . E4 . G4 . E4 . A3 . C4 . E4 . C4 .',
        'G3 . B3 . D4 . B3 . G3 . B3 . D4 . B3 .', 'C4 . E4 . G4 . E4 . C4 . . . . . . .',
      ].join(' | ')),
      ch(BASS, [
        'C3 . . C3 . . G2 . C3 . . . G2 . . .', 'G2 . . G2 . . D3 . G2 . . . D3 . . .',
        'C3 . . C3 . . G2 . C3 . . . G2 . . .', 'C3 . . C3 . . G2 . C3 . . . E3 . . .',
        'F2 . . F2 . . C3 . F2 . . . C3 . . .', 'C3 . . C3 . . G2 . A2 . . . E2 . . .',
        'G2 . . G2 . . D3 . G2 . . . D3 . . .', 'C3 . . C3 . . G2 . C3 . . . . . . .',
      ].join(' | ')),
      drums(x(D_CALYPSO, 8)),
      drums(x(D_RIDE, 8), { layer: 'ride', vol: 0.8 }),
    ],
  },

  bosque: {
    name: 'bosque',
    bpm: 104,
    channels: [
      ch(LEAD_SOFT, [
        'D5 - - - F5 - - - A5 - - - G5 - F5 -', 'E5 - - - - - - - C5 - - - - - - -',
        'D5 - - - F5 - - - A5 - - - C6 - A5 -', 'G5 - - - - - - - - - - - - - - -',
        'F5 - - - E5 - - - D5 - - - C5 - D5 -', 'E5 - - - - - - - A4 - - - - - - -',
        'D5 - - - F5 - - - G5 - - - A5 - G5 -', 'D5 - - - - - - - - - - - - - - -',
      ].join(' | ')),
      ch(ARP, x('D4 . A4 . D5 . A4 . F4 . A4 . D5 . A4 .', 2) + ' | ' + x('Bb3 . F4 . Bb4 . F4 . D4 . F4 . Bb4 . F4 .', 1) + ' | ' + x('G3 . D4 . G4 . D4 . Bb3 . D4 . G4 . D4 .', 1) + ' | ' + x('F3 . C4 . F4 . C4 . A3 . C4 . F4 . C4 .', 1) + ' | ' + x('A3 . E4 . A4 . E4 . C4 . E4 . A4 . E4 .', 1) + ' | ' + x('D4 . A4 . D5 . A4 . F4 . A4 . D5 . A4 .', 2)),
      ch(BASS, x('D3 - - - - - - - A2 - - - - - - -', 2) + ' | Bb2 - - - - - - - - - - - - - - - | G2 - - - - - - - - - - - - - - - | F2 - - - - - - - - - - - - - - - | A2 - - - - - - - - - - - - - - - | ' + x('D3 - - - - - - - A2 - - - - - - -', 2)),
      drums(x('k . . . r . . h . . k . r . . .', 8)),
      drums(x(D_RIDE, 8), { layer: 'ride', vol: 0.7 }),
    ],
  },

  penhasco: {
    name: 'penhasco',
    bpm: 140,
    channels: [
      ch(LEAD, [
        'A4 - C5 - E5 - - - D5 - C5 - D5 - E5 -', 'G5 - - - E5 - - - . . . . . . . .',
        'A4 - C5 - E5 - - - D5 - C5 - B4 - C5 -', 'D5 - - - - - - - . . . . . . . .',
        'F5 - - - E5 - - - D5 - - - C5 - D5 -', 'E5 - - - C5 - - - A4 - - - - - - -',
        'G5 - - - F5 - - - E5 - - - D5 - E5 -', 'A5 - - - - - - - . . . . . . . .',
      ].join(' | ')),
      ch(ARP, x('A3 C4 E4 A4 E4 C4 A3 C4 E4 A4 E4 C4 A3 C4 E4 A4', 2) + ' | ' + x('F3 A3 C4 F4 C4 A3 F3 A3 G3 B3 D4 G4 D4 B3 G3 B3', 1) + ' | ' + x('A3 C4 E4 A4 E4 C4 A3 C4 E4 A4 E4 C4 A3 C4 E4 A4', 1) + ' | ' + x('F3 A3 C4 F4 C4 A3 F3 A3 E3 G3 B3 E4 B3 G3 E3 G3', 2) + ' | ' + x('A3 C4 E4 A4 E4 C4 A3 C4 E4 A4 E4 C4 A3 C4 E4 A4', 2)),
      ch(BASS, x('A2 . A2 . . A2 . . E3 . . . A2 . . .', 2) + ' | F2 . F2 . . F2 . . G2 . . . G2 . . . | ' + x('A2 . A2 . . A2 . . E3 . . . A2 . . .', 1) + ' | ' + x('F2 . F2 . . F2 . . E2 . . . E2 . . .', 2) + ' | ' + x('A2 . A2 . . A2 . . E3 . . . A2 . . .', 2)),
      drums(x('k . h . s . h h k . h . s . h .', 8)),
      drums(x(D_RIDE, 8), { layer: 'ride', vol: 0.7 }),
    ],
  },

  recife: {
    name: 'recife',
    bpm: 96,
    channels: [
      ch(LEAD_SOFT, [
        'G4 - - - B4 - - - D5 - - - - - - -', 'C5 - - - B4 - - - G4 - - - - - - -',
        'A4 - - - C5 - - - E5 - - - - - - -', 'D5 - - - - - - - - - - - - - - -',
        'G4 - - - B4 - - - D5 - - - G5 - - -', 'F5 - - - D5 - - - B4 - - - - - - -',
        'C5 - - - D5 - - - E5 - - - D5 - - -', 'G4 - - - - - - - - - - - - - - -',
      ].join(' | ')),
      ch(BELLV, x('. . . . G5 . . . . . . . D5 . . .', 2) + ' | ' + x('. . . . A5 . . . . . . . E5 . . .', 2) + ' | ' + x('. . . . G5 . . . . . . . D5 . . .', 2) + ' | ' + x('. . . . C6 . . . . . . . G5 . . .', 2), { vol: 0.6 }),
      ch(PAD, 'G3 - - - - - - - - - - - - - - - | - - - - - - - - - - - - - - - - | A3 - - - - - - - - - - - - - - - | - - - - - - - - - - - - - - - - | G3 - - - - - - - - - - - - - - - | F3 - - - - - - - - - - - - - - - | C4 - - - - - - - - - - - - - - - | G3 - - - - - - - - - - - - - - -'),
      ch(BASS, x('G2 - - - - - - - - - - - D3 - - -', 2) + ' | ' + x('A2 - - - - - - - - - - - E3 - - -', 2) + ' | G2 - - - - - - - - - - - D3 - - - | F2 - - - - - - - - - - - C3 - - - | C3 - - - - - - - - - - - G2 - - - | G2 - - - - - - - - - - - - - - -'),
      drums(x('k . . . . . r . . . k . . . r .', 8)),
    ],
  },

  minas: {
    name: 'minas',
    bpm: 126,
    channels: [
      ch(LEAD_SQ, [
        'E4 - G4 - B4 - G4 - E4 - G4 - B4 - D5 -', 'C5 - - - B4 - - - A4 - - - - - - -',
        'E4 - G4 - B4 - G4 - E4 - G4 - B4 - E5 -', 'D5 - - - B4 - - - G4 - - - - - - -',
        'C5 - - - E5 - - - D5 - - - B4 - - -', 'A4 - - - C5 - - - B4 - - - G4 - - -',
        'E4 - G4 - B4 - G4 - E4 - G4 - B4 - D5 -', 'E5 - - - - - - - . . . . . . . .',
      ].join(' | ')),
      ch(HARM, x('E3 . . E3 . . B3 . E3 . . E3 . . B3 .', 4) + ' | ' + x('C4 . . C4 . . G4 . C4 . . C4 . . G4 .', 1) + ' | ' + x('A3 . . A3 . . E4 . A3 . . A3 . . E4 .', 1) + ' | ' + x('E3 . . E3 . . B3 . E3 . . E3 . . B3 .', 2)),
      ch(BASS_SAW, x('E2 . E2 . E2 . E2 . E2 . E2 . D2 . D2 .', 4) + ' | ' + x('C2 . C2 . C2 . C2 . C2 . C2 . C2 . C2 .', 1) + ' | ' + x('A2 . A2 . A2 . A2 . A2 . A2 . B2 . B2 .', 1) + ' | ' + x('E2 . E2 . E2 . E2 . E2 . E2 . D2 . D2 .', 2)),
      drums(x('k . h . s . h . k . h . s . h h', 8)),
      drums(x(D_RIDE, 8), { layer: 'ride', vol: 0.7 }),
    ],
  },

  vale: {
    name: 'vale',
    bpm: 88,
    channels: [
      ch(LEAD_SOFT, [
        'A4 - - - - - - - C5 - - - - - - -', 'B4 - - - - - - - - - - - - - - -',
        'A4 - - - - - - - E5 - - - - - - -', 'D5 - - - - - - - - - - - - - - -',
        'F5 - - - - - - - E5 - - - - - - -', 'D5 - - - C5 - - - B4 - - - - - - -',
        'A4 - - - - - - - - - - - - - - -', '. . . . . . . . . . . . . . . .',
      ].join(' | ')),
      ch(BELLV, x('. . . . . . . . . . . . E6 . . .', 2) + ' | ' + x('. . . . . . . . . . . . A5 . . .', 2) + ' | ' + x('. . . . . . . . . . . . F5 . . .', 2) + ' | ' + x('. . . . . . . . . . . . E6 . . .', 2), { vol: 0.5 }),
      ch(PAD, 'A3 - - - - - - - - - - - - - - - | - - - - - - - - - - - - - - - - | F3 - - - - - - - - - - - - - - - | - - - - - - - - - - - - - - - - | D3 - - - - - - - - - - - - - - - | E3 - - - - - - - - - - - - - - - | A3 - - - - - - - - - - - - - - - | - - - - - - - - - - - - - - - -'),
      ch(BASS, x('A2 - - - - - - - - - - - - - - -', 2) + ' | ' + x('F2 - - - - - - - - - - - - - - -', 2) + ' | D2 - - - - - - - - - - - - - - - | E2 - - - - - - - - - - - - - - - | ' + x('A2 - - - - - - - - - - - - - - -', 2)),
      drums(x('k . . . . . . . . . . . r . . .', 8), { vol: 0.6 }),
    ],
  },

  farol: {
    name: 'farol',
    bpm: 120,
    channels: [
      ch(LEAD, [
        'D5 - - - A4 - - - D5 - E5 - F5 - - -', 'E5 - - - A4 - - - E5 - F5 - G5 - - -',
        'F5 - - - E5 - - - D5 - - - C5 - - -', 'D5 - - - - - - - A4 - - - - - - -',
        'D5 - - - A4 - - - D5 - E5 - F5 - - -', 'G5 - - - F5 - - - E5 - - - D5 - - -',
        'Bb4 - - - C5 - - - D5 - - - E5 - - -', 'D5 - - - - - - - - - - - - - - -',
      ].join(' | ')),
      ch(HARM, x('D3 . A3 . D4 . A3 . D3 . A3 . D4 . A3 .', 2) + ' | ' + x('Bb3 . F4 . Bb4 . F4 . A3 . E4 . A4 . E4 .', 1) + ' | ' + x('D3 . A3 . D4 . A3 . D3 . A3 . D4 . A3 .', 2) + ' | G3 . D4 . G4 . D4 . A3 . E4 . A4 . E4 . | Bb3 . F4 . Bb4 . F4 . A3 . E4 . A4 . E4 . | ' + x('D3 . A3 . D4 . A3 . D3 . A3 . D4 . A3 .', 1)),
      ch(BASS, x('D2 . . D2 . . A2 . D2 . . D2 . . A2 .', 2) + ' | Bb1 . . Bb1 . . F2 . A1 . . A1 . . E2 . | ' + x('D2 . . D2 . . A2 . D2 . . D2 . . A2 .', 2) + ' | G1 . . G1 . . D2 . A1 . . A1 . . E2 . | Bb1 . . Bb1 . . F2 . A1 . . A1 . . E2 . | ' + x('D2 . . D2 . . A2 . D2 . . D2 . . A2 .', 1)),
      drums(x(D_MARCH, 8)),
      drums(x(D_RIDE, 8), { layer: 'ride', vol: 0.7 }),
    ],
  },

  ceu: {
    name: 'ceu',
    bpm: 150,
    channels: [
      ch(LEAD, [
        'C5 - E5 - G5 - C6 - B5 - G5 - E5 - G5 -', 'A5 - - - F5 - - - D5 - - - - - - -',
        'C5 - E5 - G5 - C6 - D6 - B5 - G5 - B5 -', 'C6 - - - - - - - . . . . . . . .',
        'F5 - A5 - C6 - A5 - E5 - G5 - B5 - G5 -', 'D5 - F5 - A5 - F5 - G5 - - - - - - -',
        'C5 - E5 - G5 - C6 - B5 - G5 - E5 - D5 -', 'C5 - - - - - - - . . . . . . . .',
      ].join(' | ')),
      ch(ARP, x('C4 G4 E5 G4 C4 G4 E5 G4 C4 G4 E5 G4 C4 G4 E5 G4', 2) + ' | ' + x('F4 C5 A5 C5 F4 C5 A5 C5 G4 D5 B5 D5 G4 D5 B5 D5', 2) + ' | ' + x('C4 G4 E5 G4 C4 G4 E5 G4 C4 G4 E5 G4 C4 G4 E5 G4', 1) + ' | ' + x('F4 C5 A5 C5 F4 C5 A5 C5 G4 D5 B5 D5 G4 D5 B5 D5', 1) + ' | ' + x('C4 G4 E5 G4 C4 G4 E5 G4 C4 G4 E5 G4 C4 G4 E5 G4', 2)),
      ch(BASS, x('C3 . C3 . G2 . G2 . C3 . C3 . G2 . G2 .', 2) + ' | ' + x('F2 . F2 . C3 . C3 . G2 . G2 . D3 . D3 .', 2) + ' | ' + x('C3 . C3 . G2 . G2 . C3 . C3 . G2 . G2 .', 1) + ' | ' + x('F2 . F2 . C3 . C3 . G2 . G2 . D3 . D3 .', 1) + ' | ' + x('C3 . C3 . G2 . G2 . C3 . C3 . G2 . G2 .', 2)),
      drums(x(D_POP, 8)),
    ],
  },

  forte: {
    name: 'forte',
    bpm: 116,
    channels: [
      ch(LEAD_SQ, [
        'E4 - - - F4 - - - E4 - - - D4 - - -', 'E4 - - - - - - - B3 - - - - - - -',
        'E4 - - - F4 - - - G4 - - - F4 - - -', 'E4 - - - - - - - - - - - - - - -',
        'A4 - - - G4 - - - F4 - - - E4 - - -', 'D4 - - - E4 - - - F4 - - - D4 - - -',
        'E4 - - - F4 - - - E4 - - - B3 - - -', 'E4 - - - - - - - - - - - - - - -',
      ].join(' | ')),
      ch(HARM, x('E3 . . . E3 . . . E3 . . . E3 . . .', 2) + ' | ' + x('C3 . . . C3 . . . C3 . . . C3 . . .', 1) + ' | ' + x('E3 . . . E3 . . . E3 . . . E3 . . .', 1) + ' | ' + x('A2 . . . A2 . . . A2 . . . A2 . . .', 1) + ' | ' + x('D3 . . . D3 . . . D3 . . . D3 . . .', 1) + ' | ' + x('E3 . . . E3 . . . E3 . . . E3 . . .', 2)),
      ch(BASS_SAW, x('E2 . E2 . E2 . E2 . E2 . E2 . F2 . F2 .', 2) + ' | ' + x('C2 . C2 . C2 . C2 . C2 . C2 . B1 . B1 .', 1) + ' | ' + x('E2 . E2 . E2 . E2 . E2 . E2 . F2 . F2 .', 1) + ' | ' + x('A1 . A1 . A1 . A1 . A1 . A1 . G1 . G1 .', 1) + ' | ' + x('D2 . D2 . D2 . D2 . D2 . D2 . E2 . E2 .', 1) + ' | ' + x('E2 . E2 . E2 . E2 . E2 . E2 . F2 . F2 .', 2)),
      drums(x('k . . . s . . . k . . k s . . .', 8)),
    ],
  },

  chefe: {
    name: 'chefe',
    bpm: 160,
    channels: [
      ch(LEAD, [
        'A4 - A4 - C5 - A4 - E5 - - - D5 - C5 -', 'A4 - A4 - C5 - A4 - G5 - - - - - - -',
        'A4 - A4 - C5 - A4 - E5 - - - F5 - E5 -', 'D5 - - - C5 - - - B4 - - - - - - -',
        'F5 - - - E5 - - - D5 - - - C5 - - -', 'G5 - - - F5 - - - E5 - - - D5 - - -',
        'A4 - A4 - C5 - A4 - E5 - - - D5 - C5 -', 'A5 - - - - - - - . . . . . . . .',
      ].join(' | ')),
      ch(BASS_SAW, x('A1 . A1 . A1 . A1 . A1 . A1 . G1 . G1 .', 2) + ' | ' + x('F1 . F1 . F1 . F1 . G1 . G1 . G1 . G1 .', 2) + ' | ' + x('D2 . D2 . D2 . D2 . C2 . C2 . C2 . C2 .', 1) + ' | ' + x('E2 . E2 . E2 . E2 . E2 . E2 . E2 . E2 .', 1) + ' | ' + x('A1 . A1 . A1 . A1 . A1 . A1 . G1 . G1 .', 2), { vol: 1.1 }),
      ch(HARM, x('A3 . . . C4 . . . A3 . . . C4 . . .', 8)),
      drums(x(D_BOSS, 8)),
    ],
  },

  chefefinal: {
    name: 'chefefinal',
    bpm: 168,
    channels: [
      ch(LEAD, [
        'D5 - - - D5 - F5 - A5 - - - G5 - F5 -', 'E5 - - - E5 - G5 - Bb5 - - - A5 - G5 -',
        'F5 - - - F5 - A5 - C6 - - - Bb5 - A5 -', 'G5 - - - A5 - - - Bb5 - - - A5 - - -',
        'D6 - - - C6 - - - Bb5 - - - A5 - - -', 'G5 - - - A5 - - - Bb5 - - - C6 - - -',
        'D5 - - - D5 - F5 - A5 - - - G5 - F5 -', 'D6 - - - - - - - . . . . . . . .',
      ].join(' | ')),
      ch(BASS_SAW, x('D2 . D2 . D2 . D2 . D2 . D2 . C2 . C2 .', 1) + ' | ' + x('E2 . E2 . E2 . E2 . E2 . E2 . D2 . D2 .', 1) + ' | ' + x('F2 . F2 . F2 . F2 . F2 . F2 . E2 . E2 .', 1) + ' | ' + x('G2 . G2 . G2 . G2 . A2 . A2 . A2 . A2 .', 1) + ' | ' + x('Bb1 . Bb1 . Bb1 . Bb1 . A1 . A1 . A1 . A1 .', 1) + ' | ' + x('G1 . G1 . G1 . G1 . A1 . A1 . A1 . A1 .', 1) + ' | ' + x('D2 . D2 . D2 . D2 . D2 . D2 . C2 . C2 .', 2), { vol: 1.1 }),
      ch(ARP, x('D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 A4 F4 D4 F4 A4 D5', 8)),
      drums(x('k k . s . k s . k k . s . k s s', 8)),
    ],
  },

  vitoria: {
    name: 'vitoria',
    bpm: 140,
    channels: [
      ch(LEAD, 'C5 - E5 - G5 - - - E5 - G5 - C6 - - - | B5 - - - G5 - - - E5 - - - - - - - | C5 - E5 - G5 - - - A5 - - - G5 - - - | C6 - - - - - - - - - - - - - - -'),
      ch(HARM, 'C4 . E4 . G4 . . . C4 . E4 . G4 . . . | G3 . B3 . D4 . . . G3 . B3 . D4 . . . | F3 . A3 . C4 . . . F3 . A3 . C4 . . . | C4 . E4 . G4 . C5 . - - - - - - - -'),
      ch(BASS, 'C3 - - - - - - - C3 - - - - - - - | G2 - - - - - - - G2 - - - - - - - | F2 - - - - - - - F2 - - - - - - - | C3 - - - - - - - - - - - - - - -'),
      drums('k . h . s . h . k . h . s . h . | k . h . s . h . k . h . s . h . | k . h . s . h . k . h . s . h . | k . . . c - - - - - - - - - - -'),
    ],
    loopStart: 64,
  },

  gameover: {
    name: 'gameover',
    bpm: 80,
    channels: [
      ch(LEAD_SOFT, 'E4 - - - D4 - - - C4 - - - B3 - - - | A3 - - - - - - - - - - - - - - - | . . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . .'),
      ch(BASS, 'A2 - - - - - - - - - - - - - - - | E2 - - - - - - - - - - - - - - - | A1 - - - - - - - - - - - - - - - | . . . . . . . . . . . . . . . .'),
    ],
    loopStart: 64,
  },

  creditos: {
    name: 'creditos',
    bpm: 108,
    channels: [
      ch(LEAD_SOFT, [
        'G4 - - - C5 - - - E5 - - - D5 - C5 -', 'D5 - - - - - - - G4 - - - - - - -',
        'A4 - - - D5 - - - F5 - - - E5 - D5 -', 'E5 - - - - - - - C5 - - - - - - -',
        'G4 - - - C5 - - - E5 - - - G5 - - -', 'F5 - - - E5 - - - D5 - - - C5 - - -',
        'D5 - - - E5 - - - F5 - - - D5 - - -', 'C5 - - - - - - - - - - - - - - -',
      ].join(' | ')),
      ch(ARP, x('C4 E4 G4 C5 G4 E4 C4 E4 G4 C5 G4 E4 C4 E4 G4 C5', 2) + ' | ' + x('F4 A4 C5 F5 C5 A4 F4 A4 C5 F5 C5 A4 F4 A4 C5 F5', 1) + ' | ' + x('A3 C4 E4 A4 E4 C4 A3 C4 E4 A4 E4 C4 A3 C4 E4 A4', 1) + ' | ' + x('C4 E4 G4 C5 G4 E4 C4 E4 G4 C5 G4 E4 C4 E4 G4 C5', 1) + ' | ' + x('F4 A4 C5 F5 C5 A4 F4 A4 G4 B4 D5 G5 D5 B4 G4 B4', 1) + ' | ' + x('G3 B3 D4 G4 D4 B3 G3 B3 D4 G4 D4 B3 G3 B3 D4 G4', 1) + ' | ' + x('C4 E4 G4 C5 G4 E4 C4 E4 C4 E4 G4 C5 G4 E4 C4 E4', 1)),
      ch(BASS, x('C3 - - - - - - - G2 - - - - - - -', 2) + ' | F2 - - - - - - - - - - - - - - - | A2 - - - - - - - - - - - - - - - | C3 - - - - - - - G2 - - - - - - - | F2 - - - - - - - G2 - - - - - - - | G2 - - - - - - - - - - - - - - - | C3 - - - - - - - - - - - - - - -'),
      drums(x(D_SOFT, 8)),
    ],
  },
};

// ---------------------------------------------------------------- faixas da expansão

/** Navio-Fantasma: cantiga de marujo em ré menor, balanço de 6/8 escrito em semicolcheias. */
MUSIC.navio = {
  name: 'navio',
  bpm: 118,
  channels: [
    ch(LEAD, [
      'D5 - - A4 - - D5 - F5 - - - E5 - D5 -', 'C5 - - A4 - - F4 - A4 - - - - - - -',
      'D5 - - A4 - - D5 - F5 - - - G5 - A5 -', 'E5 - - - C5 - - - A4 - - - - - - -',
      'A5 - - G5 - - F5 - E5 - - - F5 - G5 -', 'F5 - - E5 - - D5 - C5 - - - A4 - - -',
      'Bb4 - - D5 - - F5 - E5 - - - C5 - E5 -', 'D5 - - - - - - - . . . . . . . .',
    ].join(' | ')),
    ch(ARP, [
      '. F4 A4 . . F4 A4 . . F4 A4 . . F4 A4 .', '. A4 C5 . . A4 C5 . . A4 C5 . . A4 C5 .',
      '. F4 A4 . . F4 A4 . . F4 A4 . . F4 A4 .', '. E4 A4 . . E4 A4 . . E4 A4 . . E4 A4 .',
      '. F4 A4 . . F4 A4 . . E4 G4 . . E4 G4 .', '. F4 Bb4 . . F4 Bb4 . . F4 A4 . . F4 A4 .',
      '. G4 Bb4 . . G4 Bb4 . . E4 A4 . . E4 A4 .', '. F4 A4 . . F4 A4 . . . . . . . . .',
    ].join(' | ')),
    ch(BASS, [
      'D3 . . A2 . . D3 . D3 . . A2 . . D3 .', 'F2 . . C3 . . F2 . F2 . . C3 . . F2 .',
      'D3 . . A2 . . D3 . D3 . . A2 . . D3 .', 'A2 . . E3 . . A2 . A2 . . E3 . . A2 .',
      'D3 . . A2 . . D3 . C3 . . G2 . . C3 .', 'Bb2 . . F2 . . Bb2 . F2 . . C3 . . F2 .',
      'G2 . . D3 . . G2 . A2 . . E3 . . A2 .', 'D3 . . A2 . . D3 . D3 . . . . . . .',
    ].join(' | ')),
    drums(x('k . . h . . s . . h . . k . s .', 8)),
    drums(x(D_RIDE, 8), { layer: 'ride', vol: 0.7 }),
  ],
};

/** Cavernas e grutas: sinos esparsos com eco, pad grave e gotas. */
MUSIC.caverna = {
  name: 'caverna',
  bpm: 84,
  channels: [
    ch(BELLV, [
      'E5 - - - . . . . A5 - - - . . . .', 'G5 - - - E5 - - - D5 - - - - - - -',
      'C5 - - - . . . . E5 - - - . . . .', 'D5 - - - B4 - - - G4 - - - - - - -',
      'A4 - - - . . . . C5 - - - . . E5 -', 'F5 - - - E5 - - - C5 - - - - - - -',
      'D5 - - - E5 - - - B4 - - - E4 - - -', 'A4 - - - - - - - - - - - - - - -',
    ].join(' | ')),
    ch(BELLV, [
      '. . E5 - - - . . . . A5 - - - . .', '. . G5 - - - E5 - - - D5 - - - - -',
      '. . C5 - - - . . . . E5 - - - . .', '. . D5 - - - B4 - - - G4 - - - - -',
      '. . A4 - - - . . . . C5 - - - . .', '. . F5 - - - E5 - - - C5 - - - - -',
      '. . D5 - - - E5 - - - B4 - - - E4 -', '. . A4 - - - - - - - - - - - - -',
    ].join(' | '), { vol: 0.35 }),
    ch(PAD, 'A3 - - - - - - - - - - - - - - - | E3 - - - - - - - - - - - - - - - | C4 - - - - - - - - - - - - - - - | G3 - - - - - - - - - - - - - - - | A3 - - - - - - - - - - - - - - - | F3 - - - - - - - - - - - - - - - | D3 - - - - - - - E3 - - - - - - - | A3 - - - - - - - - - - - - - - -'),
    ch(BASS, 'A2 - - - - - - - . . . . . . . . | E2 - - - - - - - . . . . . . . . | C3 - - - - - - - . . . . . . . . | G2 - - - - - - - . . . . . . . . | A2 - - - - - - - . . . . . . . . | F2 - - - - - - - . . . . . . . . | D2 - - - - - - - E2 - - - - - - - | A2 - - - - - - - . . . . . . . .'),
    drums(x('r . . . . . . . . . r . . . . .', 8), { vol: 0.6 }),
    drums(x(D_RIDE, 8), { layer: 'ride', vol: 0.5 }),
  ],
};

/** Cassino de Conchas: valsinha de quiosque em fá maior. */
MUSIC.cassino = {
  name: 'cassino',
  bpm: 144,
  channels: [
    ch(LEAD_SQ, [
      'F5 . A5 . C6 . A5 . G5 . E5 . C5 . . .', 'D5 . F5 . A5 . F5 . E5 - - - . . . .',
      'F5 . A5 . C6 . D6 . C6 . A5 . F5 . . .', 'G5 . A5 . G5 . E5 . F5 - - - . . . .',
      'Bb5 . A5 . G5 . F5 . A5 . G5 . F5 . E5 .', 'F5 . E5 . D5 . C5 . D5 - - - . . . .',
      'C5 . D5 . E5 . F5 . G5 . A5 . Bb5 . G5 .', 'F5 - - - C5 - - - F5 - - - . . . .',
    ].join(' | ')),
    ch(ARP, [
      '. A4 . C5 . A4 . C5 . A4 . C5 . A4 . C5', '. F4 . A4 . F4 . A4 . F4 . A4 . F4 . A4',
      '. A4 . C5 . A4 . C5 . A4 . C5 . A4 . C5', '. E4 . G4 . E4 . G4 . E4 . G4 . E4 . G4',
      '. D4 . F4 . D4 . F4 . D4 . F4 . D4 . F4', '. A4 . C5 . A4 . C5 . F4 . A4 . F4 . A4',
      '. E4 . G4 . E4 . G4 . E4 . G4 . E4 . G4', '. A4 . C5 . A4 . C5 . A4 . . . . . .',
    ].join(' | ')),
    ch(BASS, [
      'F2 . C3 . F2 . C3 . F2 . C3 . F2 . C3 .', 'D3 . A2 . D3 . A2 . D3 . A2 . D3 . A2 .',
      'F2 . C3 . F2 . C3 . F2 . C3 . F2 . C3 .', 'C3 . G2 . C3 . G2 . C3 . G2 . C3 . G2 .',
      'Bb2 . F2 . Bb2 . F2 . Bb2 . F2 . Bb2 . F2 .', 'F2 . C3 . F2 . C3 . D3 . A2 . D3 . A2 .',
      'C3 . G2 . C3 . G2 . C3 . G2 . C3 . G2 .', 'F2 . C3 . F2 . C3 . F2 . . . . . . .',
    ].join(' | ')),
    drums(x('k . h . s . h . k . h . s . h h', 8)),
  ],
};

// ---------------------------------------------------------------------------
// Orquestração para o chip de samples.
// As partes acima foram escritas por papel (melodia, harmonia, baixo…); aqui cada ilha escolhe
// seus instrumentos, o pan de cada voz, o eco e, quando cabe nas 8 vozes, uma dobra da melodia.
// ---------------------------------------------------------------------------

const S = (inst: string, v: Omit<Voice, 'inst'>): Voice => ({ inst, ...v });
const sustain = (inst: string, vol: number, vib = 0): Voice => S(inst, { a: 0.03, d: 0.12, s: 0.82, r: 0.12, vol, vibDepth: vib || undefined, vibRate: vib ? 5.2 : undefined });
const pluck = (inst: string, vol: number, r = 0.15): Voice => S(inst, { a: 0.001, d: 0.25, s: 0.7, r, vol });
const padV = (inst: string, vol: number): Voice => S(inst, { a: 0.14, d: 0.2, s: 0.8, r: 0.4, vol });

const I = {
  flauta: sustain('flauta', 0.55, 14),
  ocarina: sustain('ocarina', 0.6, 12),
  metais: S('metais', { a: 0.015, d: 0.18, s: 0.72, r: 0.1, vol: 0.42, vibDepth: 9, vibRate: 5.5 }),
  acordeao: sustain('acordeao', 0.42, 6),
  orgao: S('orgao', { a: 0.004, d: 0.1, s: 0.9, r: 0.06, vol: 0.34 }),
  cordasLead: sustain('cordas', 0.38, 10),
  cordas: padV('cordas', 0.28),
  coro: padV('coro', 0.34),
  pad: padV('pad', 0.32),
  harpa: pluck('harpa', 0.42, 0.3),
  violao: pluck('violao', 0.45, 0.2),
  pizz: pluck('pizz', 0.42, 0.08),
  baixo: S('baixo', { a: 0.002, d: 0.2, s: 0.75, r: 0.06, vol: 0.85 }),
  slap: S('slap', { a: 0.001, d: 0.15, s: 0.6, r: 0.05, vol: 0.62 }),
  marimba: pluck('marimba', 0.55, 0.12),
  steel: pluck('steel', 0.5, 0.2),
  sino: pluck('sino', 0.42, 0.6),
  celesta: pluck('celesta', 0.4, 0.3),
  eletrico: pluck('eletrico', 0.48, 0.3),
};

type Role = 'LEAD' | 'LEAD_SOFT' | 'LEAD_SQ' | 'HARM' | 'PAD' | 'BASS' | 'BASS_SAW' | 'ARP' | 'BELLV';
const ROLE_OF = new Map<Voice, Role>([
  [LEAD, 'LEAD'], [LEAD_SOFT, 'LEAD_SOFT'], [LEAD_SQ, 'LEAD_SQ'], [HARM, 'HARM'], [PAD, 'PAD'],
  [BASS, 'BASS'], [BASS_SAW, 'BASS_SAW'], [ARP, 'ARP'], [BELLV, 'BELLV'],
]);
const DEFAULT_ROLES: Record<Role, Voice> = {
  LEAD: I.flauta, LEAD_SOFT: I.ocarina, LEAD_SQ: I.orgao, HARM: I.pizz, PAD: I.cordas,
  BASS: I.baixo, BASS_SAW: I.slap, ARP: I.harpa, BELLV: I.celesta,
};
const PAN: Record<Role, number> = { LEAD: 0, LEAD_SOFT: 0, LEAD_SQ: 0, HARM: 0.35, PAD: -0.3, BASS: 0, BASS_SAW: 0, ARP: -0.35, BELLV: 0.4 };
const ECHO: Record<Role, number> = { LEAD: 0.5, LEAD_SOFT: 0.55, LEAD_SQ: 0.45, HARM: 0.35, PAD: 0.6, BASS: 0, BASS_SAW: 0, ARP: 0.45, BELLV: 0.8 };

interface Orchestration {
  roles?: Partial<Record<Role, Voice>>;
  echo?: EchoParams;
  /** dobra da melodia: outro instrumento tocando a mesma parte (transposta) */
  double?: { role: Role; voice: Voice; transpose: number; vol?: number; pan?: number };
}

const ORCH: Record<string, Orchestration> = {
  titulo: { roles: { LEAD_SOFT: I.flauta, ARP: I.harpa }, echo: { delay: 0.22, feedback: 0.42, mix: 0.36 }, double: { role: 'LEAD_SOFT', voice: I.cordasLead, transpose: -12, vol: 0.55, pan: -0.25 } },
  mapa: { roles: { LEAD: I.ocarina, PAD: I.cordas }, echo: { delay: 0.16, feedback: 0.35, mix: 0.3 }, double: { role: 'LEAD', voice: I.celesta, transpose: 12, vol: 0.35, pan: 0.4 } },
  praia: { roles: { LEAD: I.steel, HARM: I.marimba, BASS: I.slap }, echo: { delay: 0.12, feedback: 0.3, mix: 0.25 }, double: { role: 'LEAD', voice: I.flauta, transpose: 0, vol: 0.4, pan: -0.3 } },
  bosque: { roles: { LEAD: I.ocarina, LEAD_SOFT: I.ocarina, HARM: I.pizz }, echo: { delay: 0.2, feedback: 0.45, mix: 0.38, tone: 2400 }, double: { role: 'LEAD_SOFT', voice: I.cordasLead, transpose: -12, vol: 0.5, pan: -0.3 } },
  penhasco: { roles: { LEAD: I.flauta, HARM: I.pizz }, echo: { delay: 0.14, feedback: 0.35, mix: 0.3 }, double: { role: 'LEAD', voice: I.cordasLead, transpose: -12, vol: 0.5, pan: -0.3 } },
  recife: { roles: { LEAD_SOFT: I.eletrico, BELLV: I.celesta, PAD: I.pad }, echo: { delay: 0.24, feedback: 0.55, mix: 0.45, tone: 2200 } },
  minas: { roles: { LEAD_SQ: I.marimba, HARM: I.pizz, BASS_SAW: I.slap }, echo: { delay: 0.1, feedback: 0.3, mix: 0.25 }, double: { role: 'LEAD_SQ', voice: I.orgao, transpose: -12, vol: 0.45, pan: -0.3 } },
  vale: { roles: { LEAD_SOFT: I.ocarina, BELLV: I.sino, PAD: I.coro }, echo: { delay: 0.24, feedback: 0.5, mix: 0.42, tone: 2600 } },
  farol: { roles: { LEAD: I.metais, HARM: I.pizz }, echo: { delay: 0.18, feedback: 0.4, mix: 0.32 }, double: { role: 'LEAD', voice: I.cordasLead, transpose: -12, vol: 0.5, pan: -0.3 } },
  ceu: { roles: { LEAD: I.flauta, HARM: I.harpa }, echo: { delay: 0.2, feedback: 0.45, mix: 0.36 }, double: { role: 'LEAD', voice: I.celesta, transpose: 12, vol: 0.35, pan: 0.4 } },
  forte: { roles: { LEAD_SQ: I.orgao, HARM: I.cordas, BASS_SAW: I.baixo }, echo: { delay: 0.2, feedback: 0.45, mix: 0.36, tone: 2600 } },
  chefe: { roles: { LEAD: I.metais, BASS_SAW: I.slap, HARM: I.pizz }, echo: { delay: 0.12, feedback: 0.3, mix: 0.25 }, double: { role: 'LEAD', voice: I.cordasLead, transpose: -12, vol: 0.5, pan: -0.3 } },
  chefefinal: { roles: { LEAD: I.metais, BASS_SAW: I.baixo, ARP: I.pizz }, echo: { delay: 0.14, feedback: 0.35, mix: 0.28 }, double: { role: 'LEAD', voice: I.coro, transpose: -12, vol: 0.6, pan: -0.3 } },
  vitoria: { roles: { LEAD: I.metais, HARM: I.marimba }, echo: { delay: 0.16, feedback: 0.35, mix: 0.3 } },
  gameover: { roles: { LEAD_SOFT: I.cordasLead }, echo: { delay: 0.24, feedback: 0.5, mix: 0.42 } },
  creditos: { roles: { LEAD_SOFT: I.flauta, ARP: I.harpa }, echo: { delay: 0.22, feedback: 0.42, mix: 0.36 }, double: { role: 'LEAD_SOFT', voice: I.cordasLead, transpose: -12, vol: 0.55, pan: -0.25 } },
  navio: { roles: { LEAD: I.acordeao, ARP: I.violao }, echo: { delay: 0.2, feedback: 0.45, mix: 0.36, tone: 2400 } },
  caverna: { roles: { BELLV: I.sino, PAD: I.coro }, echo: { delay: 0.24, feedback: 0.58, mix: 0.48, tone: 2400 } },
  cassino: { roles: { LEAD_SQ: I.eletrico, ARP: I.pizz }, echo: { delay: 0.12, feedback: 0.3, mix: 0.25 }, double: { role: 'LEAD_SQ', voice: I.marimba, transpose: 12, vol: 0.35, pan: 0.35 } },
};

function orchestrate(song: Song, o: Orchestration): void {
  const roles = { ...DEFAULT_ROLES, ...o.roles };
  const out: Channel[] = [];
  for (const c of song.channels) {
    if (c.drums) {
      out.push({ ...c, echo: c.echo ?? 0.15 });
      continue;
    }
    const role = ROLE_OF.get(c.voice);
    if (!role) {
      out.push(c);
      continue;
    }
    out.push({ ...c, voice: roles[role], pan: c.pan ?? PAN[role], echo: c.echo ?? ECHO[role] });
  }
  if (o.double) {
    const d = o.double;
    const src = song.channels.find((c) => !c.drums && ROLE_OF.get(c.voice) === d.role);
    // a dobra entra antes da bateria, para que as vozes emprestadas aos efeitos sejam as de percussão
    if (src) out.splice(Math.max(0, out.findIndex((c) => c.drums)), 0, { voice: d.voice, pattern: src.pattern, transpose: (src.transpose ?? 0) + d.transpose, vol: (src.vol ?? 1) * (d.vol ?? 0.5), pan: d.pan ?? -0.3, echo: 0.55, layer: src.layer });
  }
  song.channels = out;
  if (o.echo) song.echo = o.echo;
}

for (const [name, o] of Object.entries(ORCH)) if (MUSIC[name]) orchestrate(MUSIC[name], o);

MUSIC.bonus = { ...MUSIC.cassino, name: 'bonus' };

/** Nomes das faixas na Sala de Som, na ordem em que aparecem. */
export const TRACK_TITLES: [string, string][] = [
  ['titulo', 'O FAROL ACORDA'], ['mapa', 'O ARQUIPELAGO'], ['praia', 'PRAIA DO SINO'], ['bosque', 'BOSQUE ENCHARCADO'],
  ['penhasco', 'PENHASCO DOS VENTOS'], ['recife', 'RECIFE PROFUNDO'], ['caverna', 'GRUTAS'], ['minas', 'MINAS DE SAL'],
  ['vale', 'VALE SEM LUA'], ['navio', 'NAVIO-FANTASMA'], ['farol', 'FAROL MESTRE'], ['ceu', 'ROTA DAS CONSTELACOES'],
  ['forte', 'FORTES DA NEVOA'], ['chefe', 'GUARDIAO DO FAROL'], ['chefefinal', 'CAPITAO BRUMO'], ['cassino', 'CASSINO DE CONCHAS'],
  ['vitoria', 'FAROL A VISTA'], ['gameover', 'A NEVOA VENCEU'], ['creditos', 'LUZ NO HORIZONTE'],
];

/**
 * Mixagem: ganho por faixa para que todas soem no mesmo volume (alvo −20 dB RMS na saída; chefes −19 dB).
 * Medido com `node tools/render-music.mjs`, que renderiza cada música offline no Chromium.
 */
const MIX: Record<string, number> = {
  chefefinal: 0.85, vitoria: 0.45, chefe: 1.1, penhasco: 0.91, bosque: 0.89, minas: 1.31, farol: 0.95, mapa: 0.97, ceu: 0.77,
  titulo: 0.97, cassino: 0.93, praia: 1.12, navio: 1.07, recife: 1.2, creditos: 0.9, vale: 1.05, forte: 1.08, caverna: 1.76, gameover: 1.84,
};
for (const [k, g] of Object.entries(MIX)) if (MUSIC[k]) MUSIC[k].gain = g;
MUSIC.bonus.gain = MIX.cassino;
