/**
 * Bolota, o besouro-rola, esculpido em 16 bits. Desenho base olhando para a DIREITA.
 * Frames: 0 parado, 1-3 andando (20x13), 4-7 rolando (20x14). O olho fica em x 15-17, y 5-6
 * (a piscada é desenhada por cima nessa posição).
 */
import type { SpriteDef } from '../../engine/sprites';
import { Canvas, Materials } from '../../engine/pixelart';

const MATS = new Materials({ shell: '#36b596', belly: '#1f5a50', head: '#24343a', eye: '#ffffff', horn: '#f2c6a0', antenna: '#f6a63a' });

function walker(step: number): string {
  const c = new Canvas(20, 13, MATS);
  const legs: [number, number][] = step === 0 ? [[4, 0], [8, 0], [12, 0]] : step === 1 ? [[3, 0], [9, -1], [13, 0]] : step === 2 ? [[5, -1], [8, 0], [11, -1]] : [[4, 0], [7, -1], [13, -1]];
  // cabeça e chifre
  c.circle(15.5, 7, 3.2, 'head', 'sphere');
  c.poly([[16, 4], [18, 1.5], [18.5, 3.5]], 'horn', 'vgrad');
  c.line(14, 4, 13, 1, 'antenna', 2).set(13, 1, 'antenna', 4);
  // casco
  c.ellipse(8.5, 6.2, 7.6, 5.3, 'shell', 'sphere');
  c.rect(2, 9, 13, 2, 'belly', 'flat', 1);
  // costura dos élitros e brilho iridescente
  c.line(8, 1.5, 11, 9, 'shell', 0);
  c.set(4, 3, 'shell', 4).set(5, 2, 'shell', 4).set(6, 2, 'shell', 4).set(3, 4, 'shell', 3);
  c.outline();
  // olho por último (fica limpo sobre o contorno)
  c.set(15, 5, 'eye', 4).set(16, 5, 'eye', 4).set(17, 5, 'eye', 3).set(15, 6, 'eye', 3).set(17, 6, 'eye', 3);
  c.ink(16, 6);
  // patas por cima do contorno (a animação de andar precisa delas visíveis)
  for (const [x, up] of legs) {
    c.set(x, 11 + up, 'head', 3).set(x + 1, 11 + up, 'head', 2).set(x, 12 + up, 'head', 2).set(x + 1, 12 + up, 'head', 1);
    if (up < 0) c.ink(x, 12).ink(x + 1, 12);
  }
  return c.toString();
}

function roller(phase: number): string {
  const c = new Canvas(20, 14, MATS);
  c.circle(10, 7, 6.4, 'shell', 'sphere');
  // faixas que giram
  for (let y = 0; y < 14; y++)
    for (let x = 0; x < 20; x++) {
      const p = c.get(x, y);
      if (!p) continue;
      const v = (x + y + phase * 2) % 8;
      if (v < 2) c.tone(x, y, -2);
    }
  c.set(7, 3, 'shell', 4).set(6, 4, 'shell', 4).set(8, 3, 'shell', 3);
  c.outline();
  return c.toString();
}

const FRAMES = [walker(0), walker(1), walker(2), walker(3), roller(0), roller(1), roller(2), roller(3)];

export const BOLOTA: Record<'normal' | 'pedra' | 'seda' | 'blink', SpriteDef> = {
  normal: { palette: MATS.palette(), frames: FRAMES },
  pedra: { palette: MATS.palette({ shell: '#8d909e', belly: '#3d3f47' }), frames: FRAMES },
  seda: { palette: MATS.palette({ shell: '#d6a2ea', belly: '#6b3f8a' }), frames: FRAMES },
  blink: { palette: MATS.palette({ shell: '#36b596' }), frames: [new Canvas(3, 2, MATS).set(0, 0, 'head', 1).set(1, 0, 'head', 1).set(2, 0, 'head', 1).set(0, 1, 'head', 0).set(1, 1, 'head', 0).set(2, 1, 'head', 0).toString()] },
};

/** Posição da piscada sobre o sprite (x conforme a direção, y). */
export const BOLOTA_EYE = { x: 15, xFlip: 2, y: 5 };
