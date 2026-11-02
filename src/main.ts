/** Boot do jogo. */
import { Game } from './game/game';
import { TitleScene } from './game/scenes/title';
import { LevelScene } from './game/scenes/level';
import { WorldMapScene } from './game/scenes/worldmap';
import { synth } from './engine/audio/synth';
import { LEVELS } from './content/levels';
import { PHYS } from './game/entities/player';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas);
game.input.attachTouch(document.getElementById('touch') as HTMLElement);

// destrava o áudio no primeiro gesto
const unlock = (): void => {
  synth.unlock();
  game.applySettings();
  window.removeEventListener('keydown', unlock);
  window.removeEventListener('pointerdown', unlock);
};
window.addEventListener('keydown', unlock);
window.addEventListener('pointerdown', unlock);

// atalhos de desenvolvimento
window.addEventListener('keydown', (e) => {
  if (e.code === 'F1') { game.debug = !game.debug; e.preventDefault(); }
  if (!game.debug) return;
  const step = e.shiftKey ? 0.1 : 0.02;
  if (e.code === 'F2') PHYS.jumpV += step;
  if (e.code === 'F3') PHYS.jumpV -= step;
  if (e.code === 'F4') PHYS.grav -= step;
  if (e.code === 'F5') PHYS.grav += step;
  if (e.code === 'F6') PHYS.runMax -= step;
  if (e.code === 'F7') PHYS.runMax += step;
  if (e.code.startsWith('F')) e.preventDefault();
});

// ?level=1-1 abre direto uma fase (dev/testes); ?map abre o mapa
const params = new URLSearchParams(location.search);
const lv = params.get('level');
if (lv && LEVELS[lv]) {
  if (params.get('debug')) game.debug = true;
  game.push(new LevelScene(LEVELS[lv], game));
} else if (params.has('map')) {
  game.push(new WorldMapScene(game, null));
} else {
  game.push(new TitleScene());
}
game.start();

// expõe para testes e2e: __step(n, fn) avança n frames com entrada controlada (sem esperar o relógio)
const w = window as unknown as { __game: Game; __step: (n: number, mask: (frame: number) => number) => void };
w.__game = game;
w.__step = (n, mask) => {
  game.input.override = mask;
  for (let i = 0; i < n; i++) game.update();
  game.input.override = null;
  game.render(0);
};
