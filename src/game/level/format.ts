/** Formato de fase em texto e carregador. */
import { T, TILE_CHARS, TILE } from './tiles';

export type Theme = 'praia' | 'bosque' | 'penhasco' | 'recife' | 'minas' | 'vale' | 'farol' | 'ceu' | 'forte' | 'navio';

export interface EntitySpawn {
  kind: string;
  x: number; // em pixels (canto inferior esquerdo do tile)
  y: number;
  tx: number;
  ty: number;
  room: number;
}

export interface RoomDef {
  map: string[];
  theme?: Theme;
  /** y do nível da água em tiles (linhas abaixo são água), opcional */
  music?: string;
  dark?: boolean;
  /** rolagem automática em px/frame */
  autoscroll?: number;
  /** vento horizontal global em px/frame² */
  wind?: number;
  /** maré: amplitude em tiles e período em frames */
  tide?: { base: number; amp: number; period: number };
  /** fundo específico (sobrepõe o tema) */
  bg?: string;
  /** trava a câmera verticalmente nesta linha (em tiles) */
  lockY?: number;
  /** inunda tudo que é vazio a partir desta linha (exceto células '"', bolsões de ar) */
  water?: { y: number; x0?: number; x1?: number };
}

export interface LevelDef {
  id: string;
  name: string;
  island: number;
  theme: Theme;
  music: string;
  rooms: RoomDef[];
  /** fase tem saída secreta? */
  hasSecret?: boolean;
  /** chefe, se houver */
  boss?: string;
  /** fase de forte/farol/casa de bônus */
  kind?: 'normal' | 'forte' | 'farol' | 'bonus' | 'desafio' | 'final';
  /** dica do faroleiro-fantasma */
  hint?: string;
}

export interface Room {
  def: RoomDef;
  w: number; // tiles
  h: number;
  tiles: Uint8Array;
  /** estado por tile (ex.: crumble timer, moeda coletada) */
  spawns: EntitySpawn[];
  /** portas: dígito -> posições */
  doors: Map<number, { tx: number; ty: number }[]>;
  theme: Theme;
  /** conteúdo específico de blocos-baú (índice do tile -> 'shell'|'leaf'|'lantern'|'pearl'|'feather') */
  overrides: Map<number, string>;
}

/** Caracteres que são entidades (minúsculas e alguns símbolos) */
export const ENTITY_CHARS: Record<string, string> = {
  s: 'start', c: 'checkpoint', g: 'goal', k: 'key', l: 'lock', p: 'pearl', h: 'feather', e: 'bolota',
  r: 'crab', v: 'gull', u: 'urchin', n: 'slug', f: 'puppet', o: 'octopus', i: 'kite', j: 'jelly', t: 'mole',
  b: 'bat', w: 'sailor', m: 'platformH', q: 'platformV', z: 'fallPlat', y: 'spring', x: 'cannon', a: 'minecart',
  d: 'ghost', '@': 'sign', '9': 'secretGoal', '6': 'swing', 'ç': 'cannonL', '¬': 'sawblade', '°': 'flame', 'ª': 'fish',
};

export function parseRoom(def: RoomDef, roomIndex: number, theme: Theme): Room {
  const rows = def.map.filter((r) => r.length > 0);
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tiles = new Uint8Array(w * h);
  const spawns: EntitySpawn[] = [];
  const doors = new Map<number, { tx: number; ty: number }[]>();
  const overrides = new Map<number, string>();
  const BLOCK_OVERRIDES: Record<string, [T, string]> = {
    '+': [T.ItemPower, 'leaf'], '0': [T.ItemPower, 'lantern'], '8': [T.ItemPower, 'shell'], '7': [T.ItemAmber, 'pearl'], '5': [T.ItemPower, 'feather'],
  };
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = x < row.length ? row[x] : '.';
      const ov = BLOCK_OVERRIDES[ch];
      if (ov) {
        tiles[y * w + x] = ov[0];
        overrides.set(y * w + x, ov[1]);
        continue;
      }
      const t = TILE_CHARS[ch];
      if (t !== undefined) {
        tiles[y * w + x] = t;
        if (t >= T.Door1 && t <= T.Door4) {
          const id = t - T.Door1 + 1;
          const list = doors.get(id) ?? [];
          list.push({ tx: x, ty: y });
          doors.set(id, list);
          tiles[y * w + x] = T.Empty;
          spawns.push({ kind: 'door' + id, x: x * TILE, y: (y + 1) * TILE, tx: x, ty: y, room: roomIndex });
        }
        if (t === T.BossMarker) {
          tiles[y * w + x] = T.Empty;
          spawns.push({ kind: 'boss', x: x * TILE, y: (y + 1) * TILE, tx: x, ty: y, room: roomIndex });
        }
        continue;
      }
      const kind = ENTITY_CHARS[ch];
      if (kind) {
        spawns.push({ kind, x: x * TILE, y: (y + 1) * TILE, tx: x, ty: y, room: roomIndex });
        continue;
      }
      throw new Error(`caractere desconhecido '${ch}' em (${x},${y}) da sala ${roomIndex}`);
    }
  }
  if (def.water !== undefined) {
    const wx0 = def.water.x0 ?? 0, wx1 = def.water.x1 ?? w;
    for (let y = def.water.y; y < h; y++) {
      const row = rows[y];
      for (let x = wx0; x < wx1; x++) {
        const ch = x < row.length ? row[x] : '.';
        if (ch === '"') continue;
        if (tiles[y * w + x] === T.Empty) tiles[y * w + x] = y === def.water.y ? T.WaterTop : T.Water;
      }
    }
  }
  return { def, w, h, tiles, spawns, doors, theme: def.theme ?? theme, overrides };
}

export function parseLevel(def: LevelDef): Room[] {
  return def.rooms.map((r, i) => parseRoom(r, i, def.theme));
}

/** Funções utilitárias para os autores de fase: repetição e preenchimento. */
export function rep(s: string, n: number): string {
  return s.repeat(Math.max(0, n));
}
/** Cria linhas de uma sala a partir de colunas (para desenhar pensando em x). */
export function fromColumns(cols: string[]): string[] {
  const h = Math.max(...cols.map((c) => c.length));
  const rows: string[] = [];
  for (let y = 0; y < h; y++) rows.push(cols.map((c) => (y < c.length ? c[y] : '.')).join(''));
  return rows;
}
