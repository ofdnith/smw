/**
 * Worker de síntese: gera os samples do banco fora da thread principal.
 * Recebe uma lista de nomes e devolve um instrumento por mensagem (o PCM é transferido, sem cópia).
 */
import { instrument } from './instruments';

export interface InstrumentMsg {
  name: string;
  data: Float32Array;
  root: number;
  loopStart?: number;
  loopEnd?: number;
  bytes: number;
}

self.onmessage = (e: MessageEvent<string[]>) => {
  for (const name of e.data) {
    try {
      const i = instrument(name);
      const msg: InstrumentMsg = { name, data: i.data, root: i.root, loopStart: i.loopStart, loopEnd: i.loopEnd, bytes: i.bytes };
      (self as unknown as Worker).postMessage(msg, [i.data.buffer]);
    } catch {
      // instrumento desconhecido: ignora (a thread principal tem o fallback síncrono)
    }
  }
};
