/**
 * Gera replays de regressão: o bot tenta cada fase com várias sementes até chegar ao fim sem morrer.
 * npx vite-node tools/make-replays.ts [ids...]   (sem ids: todas as fases)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { LEVEL_LIST, LEVELS } from '../src/content/levels';
import { World } from '../src/game/world';
import { bindInput } from '../src/game/entities/player';
import { InputState } from '../src/engine/input';
import { Bot } from '../src/tools/bot';
import { encodeInputs, levelSeed, replayRun, stateHash, type Replay } from '../src/game/replay';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : LEVEL_LIST.map((l) => l.id);
const MAX_FRAMES = 9000;
const ATTEMPTS = 60;
const TAIL = 30;
mkdirSync('tests/replays', { recursive: true });
const summary: string[] = [];
for (const id of ids) {
  const level = LEVELS[id];
  if (!level) continue;
  let done: Replay | null = null;
  let best = 0;
  for (let a = 0; a < ATTEMPTS && !done; a++) {
    const world = new World(level, replayRun(), null, levelSeed(level));
    const inp = new InputState();
    bindInput(inp);
    const bot = new Bot(1000 + a * 7919);
    const masks: number[] = [];
    let end = -1;
    for (let f = 0; f < MAX_FRAMES; f++) {
      const m = end < 0 ? bot.next(world) : 0;
      masks.push(m);
      inp.prevHeld = inp.held;
      inp.held = m;
      world.update();
      if (world.event === 'died') break;
      if (end < 0 && (world.event === 'goal' || world.event === 'secret')) end = f;
      if (end >= 0 && f - end >= TAIL) break;
    }
    best = Math.max(best, world.player.x / (world.w * 16));
    if (end >= 0 && world.event !== 'died') {
      done = { level: id, seed: levelSeed(level), inputs: encodeInputs(masks), frames: masks.length, event: world.event, hash: stateHash(world) };
    }
  }
  if (done) {
    writeFileSync(`tests/replays/${id}.json`, JSON.stringify(done, null, 1) + '\n');
    summary.push(`${id} ok (${done.frames} quadros)`);
  } else summary.push(`${id} -- (${Math.round(best * 100)}%)`);
}
console.log(summary.join('\n'));
