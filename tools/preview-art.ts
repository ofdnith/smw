/**
 * Renderiza sprites ampliados num PNG para revisão: npx vite-node tools/preview-art.ts <grupo> <saida.png> [zoom]
 * Grupos: lumi, bolota, enemies, bosses, items, objects, misc, map
 */
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { parseFrame, type SpriteDef } from '../src/engine/sprites';
import { LUMI, LUMI_PALETTE, ACCESSORY } from '../src/content/art/lumi';

const [, , group = 'lumi', out = 'preview.png', zoomArg = '6'] = process.argv;
async function load(): Promise<Record<string, SpriteDef>> {
  switch (group) {
    case 'lumi': return { ...Object.fromEntries(Object.entries(LUMI).map(([k, f]) => [k, { palette: LUMI_PALETTE, frames: f }])), ...ACCESSORY };
    case 'bolota': return (await import('../src/content/art/bolota')).BOLOTA as unknown as Record<string, SpriteDef>;
    case 'enemies': return (await import('../src/content/art/enemies')).ENEMIES;
    case 'bosses': return (await import('../src/content/art/bosses')).BOSSES;
    case 'items': { const m = await import('../src/content/art/items'); return { ...m.ITEMS, ghost: m.GHOST, bell: m.BELL, sign: m.SIGN, arch: m.GOAL_ARCH }; }
    case 'objects': return (await import('../src/content/art/objects')).OBJECTS;
    case 'misc': { const m = await import('../src/content/art/npcs'); return { ondina: m.ONDINA, farol: m.LIGHTHOUSE }; }
    case 'map': return (await import('../src/content/art/mapicons')).MAP_ICONS;
    default: return {};
  }
}
const set = await load();
const sprites = Object.entries(set).flatMap(([name, def]) => def.frames.map((f, i) => ({ name: `${name}${def.frames.length > 1 ? i : ''}`, rows: parseFrame(f), pal: def.palette })));
writeFileSync('/tmp/_art.json', JSON.stringify(sprites));
execSync(`python3 - <<'PY'
import json
from PIL import Image, ImageDraw
sp = json.load(open('/tmp/_art.json'))
Z = ${parseInt(zoomArg, 10)}
pad = 6
cols = 8
cw = max(len(s['rows'][0]) for s in sp) * Z + pad * 2
ch = max(len(s['rows']) for s in sp) * Z + pad * 2 + 12
rows = (len(sp) + cols - 1) // cols
img = Image.new('RGB', (cols * cw, rows * ch), (58, 74, 96))
d = ImageDraw.Draw(img)
for i, s in enumerate(sp):
    ox, oy = (i % cols) * cw + pad, (i // cols) * ch + pad
    for y, row in enumerate(s['rows']):
        for x, c in enumerate(row):
            col = s['pal'].get(c)
            if not col or c in '. ': continue
            h = col.lstrip('#'); rgb = tuple(int(h[k:k+2], 16) for k in (0, 2, 4))
            d.rectangle([ox + x * Z, oy + y * Z, ox + x * Z + Z - 1, oy + y * Z + Z - 1], fill=rgb)
    d.text((ox, oy + len(s['rows']) * Z + 1), s['name'][:14], fill=(230, 230, 230))
img.save('${out}')
PY`);
console.log(`${sprites.length} quadros -> ${out}`);
