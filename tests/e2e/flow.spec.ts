import { test, expect, type Page } from '@playwright/test';

/** Avança n frames de lógica com a máscara de entrada dada (bits: 1 esq, 2 dir, 4 cima, 8 baixo, 16 pulo, 32 correr, 64 giro, 128 pausa). */
async function step(page: Page, n: number, mask = 0): Promise<void> {
  await page.evaluate(([n, mask]) => window.__step(n, () => mask), [n, mask]);
}
async function press(page: Page, mask: number): Promise<void> {
  await step(page, 1, mask);
  await step(page, 1, 0);
}
async function sceneName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const g = window.__game;
    return g.scenes[g.scenes.length - 1].constructor.name;
  });
}
async function stop(page: Page): Promise<void> {
  await page.evaluate(() => window.__game.loop.stop());
}
async function skipTransition(page: Page): Promise<void> {
  await step(page, 70, 0);
}

declare global {
  interface Window {
    __game: {
      loop: { stop(): void };
      scenes: { constructor: { name: string }; world?: unknown }[];
      slot: { cleared: string[]; secret: string[]; lives: number; flags: string[]; node: string };
      persist(): void;
    } & Record<string, unknown>;
    __step: (n: number, mask: (f: number) => number) => void;
  }
}

test('título → arquivo → mapa → fase → fim → mapa com caminho novo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5195/');
  await page.waitForTimeout(300);
  await stop(page);
  expect(await sceneName(page)).toBe('TitleScene');
  await step(page, 30, 0);
  await press(page, 16);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('FileSelectScene');
  await press(page, 16);
  await skipTransition(page);
  // mapa com introdução por cima
  expect(await sceneName(page)).toBe('CutsceneScene');
  for (let i = 0; i < 6; i++) {
    await step(page, 400, 0);
    await press(page, 16);
    await step(page, 5, 0);
  }
  expect(await sceneName(page)).toBe('WorldMapScene');
  // anda até 1-1 e entra
  await press(page, 2);
  await step(page, 120, 0);
  await press(page, 16);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('LevelScene');
  // completa a fase "na marra": teleporta Lumi para o arco
  await page.evaluate(() => {
    const g = window.__game;
    const sc = g.scenes[g.scenes.length - 1] as unknown as { world: { entities: { kind: string; x: number; y: number }[]; player: { placeAt(x: number, y: number): void } } };
    const goal = sc.world.entities.find((e) => e.kind === 'goal') ?? null;
    const w = sc.world as unknown as { room: { spawns: { kind: string; x: number; y: number }[] }; activateSpawns(): void; camX: number };
    const sp = w.room.spawns.find((s) => s.kind === 'goal')!;
    sc.world.player.placeAt(sp.x - 40, sp.y);
    w.camX = sp.x - 160;
    w.activateSpawns();
    void goal;
  });
  await step(page, 120, 2 | 32);
  const ev = await page.evaluate(() => (window.__game.scenes[window.__game.scenes.length - 1] as unknown as { world: { event: string } }).world.event);
  expect(ev).toBe('goal');
  await step(page, 260, 0);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('WorldMapScene');
  const slot = await page.evaluate(() => window.__game.slot);
  expect(slot.cleared).toContain('1-1');
  expect(errors).toEqual([]);
});

test('zerar o último farol leva aos créditos e a pausa funciona', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5195/?level=7-3');
  await page.waitForTimeout(300);
  await stop(page);
  // pausa
  await press(page, 128);
  expect(await sceneName(page)).toBe('PauseScene');
  await press(page, 128);
  expect(await sceneName(page)).toBe('LevelScene');
  // força o fim da fase
  await page.evaluate(() => {
    const sc = window.__game.scenes[window.__game.scenes.length - 1] as unknown as { world: { finish(secret: boolean): void } };
    sc.world.finish(false);
  });
  await step(page, 260, 0);
  await skipTransition(page);
  // cutscenes (introdução, se for a primeira vez, e a do farol 7) e depois créditos
  expect(await sceneName(page)).toBe('CutsceneScene');
  for (let i = 0; i < 14 && (await sceneName(page)) === 'CutsceneScene'; i++) {
    await step(page, 500, 0);
    await press(page, 16);
    await step(page, 80, 0);
  }
  expect(await sceneName(page)).toBe('CreditsScene');
  await step(page, 100, 0);
  await press(page, 128);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('WorldMapScene');
  expect(errors).toEqual([]);
});

test('todas as fases abrem e rodam 300 frames sem erro', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5195/?level=1-1');
  await page.waitForTimeout(300);
  const ids = await page.evaluate(() => (window.__game as unknown as { levelIds: string[] }).levelIds);
  expect(ids.length).toBeGreaterThan(30);
  for (const id of ids) {
    await page.goto(`http://localhost:5195/?level=${id}`);
    await page.waitForTimeout(150);
    await stop(page);
    await step(page, 300, 2 | 32 | 16);
    expect(await sceneName(page), id).toMatch(/LevelScene|GameOverScene/);
  }
  expect(errors).toEqual([]);
});

test('replays dão o mesmo estado no navegador e no Node (determinismo entre motores)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5195/?level=1-1');
  await page.waitForTimeout(300);
  await stop(page);
  const result = await page.evaluate(async () => {
    const ids = (window.__game as unknown as { levelIds: string[] }).levelIds;
    const out: { id: string; ok: boolean; got: string; want: string }[] = [];
    for (const id of ids) {
      const res = await fetch(`/tests/replays/${id}.json`);
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) continue;
      const r = await res.json() as { hash: string; event: string };
      const got = (window as unknown as { __replay: (r: unknown) => { hash: string; event: string } }).__replay(r);
      out.push({ id, ok: got.hash === r.hash && got.event === r.event, got: got.hash, want: r.hash });
    }
    return out;
  });
  expect(result.length).toBeGreaterThanOrEqual(10);
  expect(result.filter((r) => !r.ok)).toEqual([]);
  expect(errors).toEqual([]);
});

test('extras, opções e contra-relógio abrem pela seleção de arquivo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5195/');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const ids = (window.__game as unknown as { levelIds: string[] }).levelIds;
    const slot = { version: 1, cleared: ids, secret: [], pearls: Object.fromEntries(ids.map((id) => [id, 7])), lives: 9, amber: 50, power: 'none', reserve: 'none', hasBolota: true, node: 'i1-start', playtimeFrames: 0, flags: ['intro'], deaths: 0 };
    localStorage.setItem('lumi.save.v1', JSON.stringify({ version: 1, slots: [slot, null, null], settings: {}, records: {} }));
  });
  await page.goto('http://localhost:5195/');
  await page.waitForTimeout(300);
  await stop(page);
  await step(page, 30, 0);
  await press(page, 16);
  await skipTransition(page);
  for (let i = 0; i < 3; i++) await press(page, 8);
  await press(page, 16);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('ExtrasScene');
  // contra-relógio: terceira opção
  await press(page, 8);
  await press(page, 8);
  await press(page, 16);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('TimeAttackScene');
  await press(page, 16);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('LevelScene');
  // desiste pela pausa
  await press(page, 128);
  for (let i = 0; i < 5; i++) await press(page, 8);
  await press(page, 16);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('TimeAttackScene');
  // o arquivo do jogador não foi tocado
  const slot = await page.evaluate(() => (window.__game as unknown as { save: { slots: { deaths: number }[] } }).save.slots[0]);
  expect(slot.deaths).toBe(0);
  // volta e abre as opções
  await press(page, 64);
  await skipTransition(page);
  await press(page, 64);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('FileSelectScene');
  await press(page, 2);
  await press(page, 16);
  await skipTransition(page);
  expect(await sceneName(page)).toBe('OptionsScene');
  expect(errors).toEqual([]);
});
