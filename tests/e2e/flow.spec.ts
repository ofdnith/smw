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
