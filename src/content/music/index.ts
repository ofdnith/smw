/**
 * Trilha sonora original, em formato tracker:
 * cada token é uma semicolcheia; '.' pausa, '-' prolonga a nota anterior; '|' só separa compassos.
 */
import type { Song, Channel } from '../../engine/audio/sequencer';
import type { Voice } from '../../engine/audio/synth';

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

MUSIC.navio = { ...MUSIC.farol, name: 'navio' };
MUSIC.caverna = { ...MUSIC.recife, name: 'caverna', bpm: 90 };
MUSIC.bonus = { ...MUSIC.titulo, name: 'bonus' };
