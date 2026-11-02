/**
 * Codec ADPCM de 4 bits do "console virtual" (formato nosso).
 *
 * Os chips de som de 16 bits guardavam samples comprimidos em blocos curtos com
 * um deslocamento e um preditor por bloco. O resultado tem um grão característico:
 * ruído de quantização baixo e "colorido" pelo preditor. Aqui fazemos o mesmo
 * com parâmetros próprios:
 *
 * - bloco de 16 samples = 1 byte de cabeçalho (deslocamento 0..12, preditor 0..3) + 8 bytes (16 nibbles com sinal);
 * - preditores lineares de até 2ª ordem, com coeficientes escolhidos por nós;
 * - amostras de 16 bits com saturação.
 *
 * O encoder escolhe, por bloco, o par (deslocamento, preditor) de menor erro.
 */

export const BLOCK = 16;
export const BLOCK_BYTES = 9;

/** Coeficientes [a1, a2] de cada preditor: y ≈ a1·p1 + a2·p2. */
export const PREDICTORS: readonly (readonly [number, number])[] = [
  [0, 0],
  [7 / 8, 0],
  [7 / 4, -13 / 16],
  [3 / 2, -5 / 8],
];

const clamp16 = (v: number): number => (v > 32767 ? 32767 : v < -32768 ? -32768 : v);

function predict(f: number, p1: number, p2: number): number {
  const [a1, a2] = PREDICTORS[f];
  return Math.trunc(a1 * p1 + a2 * p2);
}

/** Codifica samples em [-1, 1] para blocos ADPCM. O comprimento é arredondado para cima em blocos de 16. */
export function encode(src: Float32Array): Uint8Array {
  const nBlocks = Math.ceil(src.length / BLOCK);
  const out = new Uint8Array(nBlocks * BLOCK_BYTES);
  let p1 = 0, p2 = 0;
  const pcm = new Int32Array(BLOCK);
  const nib = new Int8Array(BLOCK);
  const bestNib = new Int8Array(BLOCK);
  for (let b = 0; b < nBlocks; b++) {
    for (let i = 0; i < BLOCK; i++) {
      const s = src[b * BLOCK + i] ?? 0;
      pcm[i] = clamp16(Math.round(s * 32767));
    }
    let bestErr = Infinity, bestShift = 0, bestF = 0, bestP1 = 0, bestP2 = 0;
    for (let f = 0; f < PREDICTORS.length; f++) {
      for (let shift = 0; shift <= 12; shift++) {
        let q1 = p1, q2 = p2, err = 0;
        const step = 1 << shift;
        for (let i = 0; i < BLOCK; i++) {
          const pred = predict(f, q1, q2);
          let n = Math.round((pcm[i] - pred) / step);
          n = n > 7 ? 7 : n < -8 ? -8 : n;
          const y = clamp16(pred + n * step);
          nib[i] = n;
          const e = y - pcm[i];
          err += e * e;
          if (err >= bestErr) break;
          q2 = q1;
          q1 = y;
        }
        if (err < bestErr) {
          bestErr = err; bestShift = shift; bestF = f; bestP1 = q1; bestP2 = q2;
          bestNib.set(nib);
        }
      }
    }
    const o = b * BLOCK_BYTES;
    out[o] = (bestShift << 4) | bestF;
    for (let i = 0; i < BLOCK; i += 2) out[o + 1 + i / 2] = ((bestNib[i] & 15) << 4) | (bestNib[i + 1] & 15);
    p1 = bestP1;
    p2 = bestP2;
  }
  return out;
}

/** Decodifica blocos ADPCM para samples em [-1, 1]. */
export function decode(data: Uint8Array, length?: number): Float32Array {
  const nBlocks = Math.floor(data.length / BLOCK_BYTES);
  const out = new Float32Array(length ?? nBlocks * BLOCK);
  let p1 = 0, p2 = 0;
  for (let b = 0; b < nBlocks; b++) {
    const o = b * BLOCK_BYTES;
    const shift = data[o] >> 4, f = data[o] & 3;
    const step = 1 << shift;
    for (let i = 0; i < BLOCK; i++) {
      const byte = data[o + 1 + (i >> 1)];
      let n = i & 1 ? byte & 15 : byte >> 4;
      if (n >= 8) n -= 16;
      const y = clamp16(predict(f, p1, p2) + n * step);
      const k = b * BLOCK + i;
      if (k < out.length) out[k] = y / 32768;
      p2 = p1;
      p1 = y;
    }
  }
  return out;
}
