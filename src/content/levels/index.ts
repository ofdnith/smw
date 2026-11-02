/** Todas as fases, indexadas por id. */
import type { LevelDef } from '../../game/level/format';
import { ISLAND1 } from './island1';
import { ISLAND2 } from './island2';
import { ISLAND3 } from './island3';
import { ISLAND4 } from './island4';
import { ISLAND5 } from './island5';
import { ISLAND6 } from './island6';
import { ISLAND7 } from './island7';

const ALL: LevelDef[] = [...ISLAND1, ...ISLAND2, ...ISLAND3, ...ISLAND4, ...ISLAND5, ...ISLAND6, ...ISLAND7];

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(ALL.map((l) => [l.id, l]));
export const LEVEL_LIST = ALL;
