/** Fiscal de hardware (linha de comando): npx vite-node tools/fiscal.ts */
import { collectSprites } from '../src/tools/fiscal';
import { INSTRUMENT_NAMES, instrument } from '../src/engine/audio/instruments';
import { MUSIC } from '../src/content/music';

{
  const sprites = collectSprites().sort((a, b) => b.raw - a.raw);
  const over = sprites.filter((s) => s.raw > 15);
  console.log(`SPRITES: ${sprites.length}; ${over.length} desenhados com mais de 15 cores (o console encaixa em 15):`);
  for (const s of over.slice(0, 40)) console.log('  ', String(s.raw).padStart(3), '->', s.colors, s.name);
  const bad = sprites.filter((s) => s.colors > 15);
  if (bad.length) console.log('VIOLACOES:', bad.map((s) => s.name).join(', '));
  const bytes = INSTRUMENT_NAMES.reduce((a, n) => a + instrument(n).bytes, 0);
  console.log(`SOM: ${INSTRUMENT_NAMES.length} instrumentos, ${(bytes / 1024).toFixed(0)} KB comprimidos`);
  const maxCh = Math.max(...Object.values(MUSIC).map((s) => s.channels.length));
  console.log(`MUSICA: no máximo ${maxCh} vozes por faixa (limite 8)`);
}
