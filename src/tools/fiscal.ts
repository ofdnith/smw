/**
 * Fiscal de hardware: confere os assets contra as regras do console virtual.
 * Linha de comando: npx vite-node tools/fiscal.ts
 *
 * Hoje mede (e o teste `hardware.test.ts` trava regressões):
 * - cores por sprite (limite do console: 15 + transparente por sub-paleta);
 * - instrumentos e memória de som;
 * - vozes por música.
 */
import * as bolota from '../content/art/bolota';
import * as bosses from '../content/art/bosses';
import * as enemies from '../content/art/enemies';
import * as items from '../content/art/items';
import * as lumi from '../content/art/lumi';
import * as mapicons from '../content/art/mapicons';
import * as npcs from '../content/art/npcs';
import * as objects from '../content/art/objects';
import { fitPalette, type SpriteDef } from '../engine/sprites';
import { rgb555 } from '../engine/console';

export interface SpriteReport { name: string; colors: number; raw: number }

function isDef(v: unknown): v is SpriteDef {
  return !!v && typeof v === 'object' && 'palette' in v && 'frames' in v && Array.isArray((v as SpriteDef).frames);
}

/** Cores distintas (já em RGB555) que um sprite usa na tela, depois do encaixe de paleta. */
export function spriteColors(def: SpriteDef, raw = false): number {
  const used = new Set<string>();
  const pal = raw ? def.palette : fitPalette(def);
  for (const f of def.frames) for (const ch of f) {
    if (ch === '.' || ch === ' ' || ch === '\n') continue;
    const c = pal[ch];
    if (c) used.add(rgb555(c));
  }
  return used.size;
}

export function collectSprites(): SpriteReport[] {
  const out: SpriteReport[] = [];
  const seen = new Set<SpriteDef>();
  const walk = (prefix: string, v: unknown, depth: number): void => {
    if (depth > 3 || !v || typeof v !== 'object') return;
    if (isDef(v)) {
      if (!seen.has(v)) { seen.add(v); out.push({ name: prefix, colors: spriteColors(v), raw: spriteColors(v, true) }); }
      return;
    }
    for (const [k, x] of Object.entries(v)) walk(prefix ? `${prefix}.${k}` : k, x, depth + 1);
  };
  const mods: Record<string, unknown> = { bolota, bosses, enemies, items, lumi, mapicons, npcs, objects };
  for (const [m, mod] of Object.entries(mods)) walk(m, mod, 0);
  return out;
}

