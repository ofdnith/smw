/** Save em localStorage, 3 slots, versionado. */

export const SAVE_VERSION = 1;
const KEY = 'lumi.save.v1';

export interface SaveSlot {
  version: number;
  /** ids de fases concluídas pela saída normal */
  cleared: string[];
  /** ids de fases concluídas pela saída secreta */
  secret: string[];
  /** pérolas: id da fase -> máscara de 3 bits */
  pearls: Record<string, number>;
  lives: number;
  amber: number;
  power: string; // 'none' | 'shell' | 'leaf' | 'lantern'
  reserve: string;
  hasBolota: boolean;
  /** nó do mapa onde Lumi está */
  node: string;
  playtimeFrames: number;
  /** eventos de história vistos */
  flags: string[];
  deaths: number;
}

export interface Settings {
  music: number; // 0..10
  sfx: number;
  assist: boolean;
  touch: boolean;
}

export interface SaveFile {
  version: number;
  slots: (SaveSlot | null)[];
  settings: Settings;
}

export function newSlot(): SaveSlot {
  return {
    version: SAVE_VERSION,
    cleared: [],
    secret: [],
    pearls: {},
    lives: 5,
    amber: 0,
    power: 'none',
    reserve: 'none',
    hasBolota: false,
    node: 'i1-start',
    playtimeFrames: 0,
    flags: [],
    deaths: 0,
  };
}

export function defaultSettings(): Settings {
  return { music: 7, sfx: 8, assist: false, touch: false };
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadSaveFile(): SaveFile {
  const empty: SaveFile = { version: SAVE_VERSION, slots: [null, null, null], settings: defaultSettings() };
  const s = storage();
  if (!s) return empty;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SaveFile>;
    const slots = (parsed.slots ?? [null, null, null]).map((sl) => (sl ? { ...newSlot(), ...sl } : null));
    while (slots.length < 3) slots.push(null);
    return { version: SAVE_VERSION, slots: slots.slice(0, 3), settings: { ...defaultSettings(), ...(parsed.settings ?? {}) } };
  } catch {
    return empty;
  }
}

export function storeSaveFile(f: SaveFile): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(f));
  } catch {
    /* sem espaço ou modo privado: ignora */
  }
}

export function slotProgress(slot: SaveSlot, totalLevels: number): number {
  return Math.round((slot.cleared.length / Math.max(1, totalLevels)) * 100);
}
