/** Todas as fases, indexadas por id. */
import type { LevelDef } from '../../game/level/format';
import { ISLAND1 } from './island1';

const ALL: LevelDef[] = [...ISLAND1];

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(ALL.map((l) => [l.id, l]));
export const LEVEL_LIST = ALL;
