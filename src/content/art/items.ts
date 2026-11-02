/** Itens e objetos de fase. */
import type { SpriteDef } from '../../engine/sprites';

const K = '#1b1b2f';

export const ITEMS: Record<string, SpriteDef> = {
  shell: {
    palette: { '.': null, k: K, p: '#f5b7c8', P: '#d98aa3', w: '#fff0f5', s: '#f2c6a0' },
    frames: [`
.....kkkkkk.....
...kkpwwpppkk...
..kppwwppppppk..
.kppwppPpppPppk.
.kpppppPppPpppk.
kppppPPPpPPppppk
kpPPPPPPPPPPPPpk
kPPPPPPPPPPPPPPk
.kPPPPPPPPPPPPk.
..kkPPPPPPPPkk..
....kkkkkkkk....`],
  },
  leaf: {
    palette: { '.': null, k: '#1b3a1b', g: '#8fd14f', G: '#5f9a2d', l: '#c8f27a', t: '#6b4f2e' },
    frames: [`
..........kk....
........kkggk...
......kkglggGk..
....kkggllggGk..
..kkgglllgggGk..
.kgggllgggggGk..
kgGGglggggGGk...
kgGGGGggGGGk....
.kGGGGGGGkk.....
..kkkkkkktk.....
..........tk....`, `
....kk..........
...kggkk........
..kGgglgkk......
..kGggllggkk....
..kGggglllggkk..
..kGgggggllgggk.
...kGGggggglGGgk
....kGGGggGGGGgk
.....kkGGGGGGGk.
.....ktkkkkkkk..
....kt..........`],
  },
  lantern: {
    palette: { '.': null, k: K, m: '#8a7a5a', M: '#5a4a35', g: '#bfe3ff', G: '#5fb4e8', f: '#ffffff' },
    frames: [`
......kkkk......
.....kmmmmk.....
.....kMmmMk.....
....kkkkkkkk....
...kggggggggk...
...kgGGGGGGgk...
...kgGGffGGgk...
...kgGGffGGgk...
...kgGGGGGGgk...
...kggggggggk...
....kkkkkkkk....
.....kMMMMk.....
......kkkk......`, `
......kkkk......
.....kmmmmk.....
.....kMmmMk.....
....kkkkkkkk....
...kggggggggk...
...kgGGGGGGgk...
...kgGfGGfGgk...
...kgGGffGGgk...
...kgGfGGfGgk...
...kggggggggk...
....kkkkkkkk....
.....kMMMMk.....
......kkkk......`],
  },
  feather: {
    palette: { '.': null, k: '#3a3a4a', w: '#ffffff', g: '#c9ccd6', G: '#8a8f9e' },
    frames: [`
..........kk....
........kkwwk...
......kkwwwwk...
....kkwwwgwwk...
..kkwwwwgwwwk...
.kwwwwwgwwwwk...
kwwwwwgwwwwk....
kgwwwgwwwwk.....
.kGwgwwwkk......
..kkGkkk........
....kG..........
.....kG.........`],
  },
  pearl: {
    palette: { '.': null, k: '#2a3a4a', w: '#ffffff', p: '#e8f3ff', P: '#b9d6ee', b: '#8fb8dd', y: '#fff5c2' },
    frames: [`
...kkkk...
..kpwwpk..
.kpwwpppk.
kpwwppppPk
kpwpppPPPk
kppppPPPbk
kpppPPPbbk
.kPPPPbbk.
..kPbbbk..
...kkkk...`, `
...kkkk...
..kppwpk..
.kppwwppk.
kpppwwpppk
kppppwpPPk
kppppPPPbk
kpppPPPbbk
.kPPPPbbk.
..kPbbbk..
...kkkk...`, `
...kkkk...
..kppppk..
.kpppwppk.
kppppwwppk
kpppwwwPPk
kppppwPPbk
kpppPPPbbk
.kPPPPbbk.
..kPbbbk..
...kkkk...`, `
...kkkk...
..kpyppk..
.kywpyppk.
kpypwpyppk
kyppppPPyk
kppppPPPbk
kpppPPPbbk
.kPPPybbk.
..kPbbbk..
...kkkk...`],
  },
  key: {
    palette: { '.': null, k: '#3a2a10', y: '#ffd24a', Y: '#c9961a', w: '#fff3b0' },
    frames: [`
..kkkk..
.kywwyk.
kyw..wyk
kyw..yyk
.kyyyyk.
..kyyk..
..kYyk..
..kYyk..
..kYykk.
..kYyYk.
..kYykk.
..kYyYk.
..kkkk..`],
  },
  lock: {
    palette: { '.': null, k: '#2a1a08', b: '#7a5a3a', B: '#5a3f26', y: '#ffd24a', Y: '#c9961a', d: '#3a2a16' },
    frames: [`
kkkkkkkkkkkkkkkk
kbbbbbbbbbbbbbbk
kbBBBBBBBBBBBBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBdddkkkkdddBbk
kbBddkyyyykddBbk
kbBddkyYYykddBbk
kbBddkyYYykddBbk
kbBdddkyykdddBbk
kbBddddkkddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBBBBBBBBBBBBbk
kbbbbbbbbbbbbbbk
kkkkkkkkkkkkkkkk`, `
kkkkkkkkkkkkkkkk
kbbbbbbbbbbbbbbk
kbBBBBBBBBBBBBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBdddkkkkdddBbk
kbBddkYyyYkddBbk
kbBddkyYYykddBbk
kbBddkyYYykddBbk
kbBdddkyykdddBbk
kbBddddkkddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBddddddddddBbk
kbBBBBBBBBBBBBbk
kbbbbbbbbbbbbbbk
kkkkkkkkkkkkkkkk`],
  },
  flag: {
    palette: { '.': null, k: '#1b1b2f', r: '#e85d4a', y: '#ffd24a', w: '#ffffff' },
    frames: [`
kkkkkkkk
kryryryk
kyryryrk
kryryryk
kkkkkkkk`, `
.kkkkkkk
kyryryrk
kryryryk
kyryryrk
.kkkkkkk`],
  },
  amber: {
    palette: { '.': null, k: '#6b3a0a', o: '#ff9f2e', O: '#e07a12', w: '#ffe29a' },
    frames: [`
...kk...
..kowk..
.kooowk.
.koooOk.
.kOoOOk.
..kOOk..
...kk...`, `
...kk...
..kwk...
..kook..
..kOok..
..kOOk..
..kOk...
...kk...`, `
...kk...
..kwok..
.kwoook.
.koOoOk.
.kOOOOk.
..kOOk..
...kk...`, `
...kk...
...kwk..
..kook..
..koOk..
..kOOk..
...kOk..
...kk...`],
  },
  orb: {
    palette: { '.': null, g: '#bfe3ff', G: '#5fb4e8', w: '#ffffff' },
    frames: [`
..gggg..
.gGwwGg.
gGwwwwGg
gGwwwwGg
gGwwwwGg
gGwwwwGg
.gGwwGg.
..gggg..`, `
..GGGG..
.GgwwgG.
GgwwwwgG
GgwwwwgG
GgwwwwgG
GgwwwwgG
.GgwwgG.
..GGGG..`],
  },
  goldDoor: {
    palette: { '.': null, k: '#3a2a08', y: '#ffd24a', Y: '#c9961a', w: '#fff3b0', d: '#5a4210' },
    frames: [`
....kkkkkkkk....
..kkyyyyyyyykk..
.kyyyYYYYYYyyyk.
kyyYYddddddYYyyk
kyYYddddddddYYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddwwddddYyk
kyYdddwwwwdddYyk
kyYdddwwwwdddYyk
kyYddddwwddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYdddddddddwYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYYYYYYYYYYYYyk
kkkkkkkkkkkkkkkk`, `
....kkkkkkkk....
..kkyyyyyyyykk..
.kyyyYYYYYYyyyk.
kyyYYddddddYYyyk
kyYYddddddddYYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYdddddwddddYyk
kyYddddwwwdddYyk
kyYdddwwwwwddYyk
kyYdddwwwwwddYyk
kyYddddwwwdddYyk
kyYdddddwddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYdddddddddwYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYddddddddddYyk
kyYYYYYYYYYYYYyk
kkkkkkkkkkkkkkkk`],
  },
};

/** Sino de farol (checkpoint): 12x32; frame 1 = tocado (dourado). */
export const BELL: SpriteDef = {
  palette: { '.': null, k: '#2a1a08', p: '#8a6a4a', P: '#5f4630', b: '#8f8f9a', B: '#60606a', y: '#ffd24a', Y: '#c9961a', w: '#fff3b0' },
  frames: [`
.....kk.....
....kppk....
....kppk....
...kkkkkk...
..kbbbbbbk..
.kbbBbbbBbk.
.kbbBbbbBbk.
kbbbBbbbBbbk
kbbbBbbbBbbk
kbbBBbbBBbbk
kBBBBBBBBBBk
.kkkkkkkkkk.
.....kk.....
....kBBk....
.....kk.....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
...kPPPPk...
...kkkkkk...`, `
.....kk.....
....kppk....
....kppk....
...kkkkkk...
..kyywyyk...
.kyyYwyyYyk.
.kyyYwyyYyk.
kyyyYyyyYyyk
kyyyYyyyYyyk
kyyYYyyYYyyk
kYYYYYYYYYYk
.kkkkkkkkkk.
.....kk.....
....kYYk....
.....kk.....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
....kppk....
...kPPPPk...
...kkkkkk...`],
};

/** Arco de corda com bandeirolas: 32x64. */
export const GOAL_ARCH: SpriteDef = {
  palette: { '.': null, k: '#2a1a08', p: '#8a6a4a', P: '#5f4630', r: '#c9a66b', R: '#a8844a', g: '#6fcf6f' },
  frames: [
    (() => {
      const rows: string[] = [];
      for (let y = 0; y < 64; y++) {
        let row = '';
        for (let x = 0; x < 32; x++) {
          let c = '.';
          // postes
          if (x >= 1 && x <= 4) c = x === 1 || x === 4 ? 'k' : y % 8 === 0 ? 'P' : 'p';
          if (x >= 27 && x <= 30) c = x === 27 || x === 30 ? 'k' : y % 8 === 0 ? 'P' : 'p';
          // topo dos postes
          if (y <= 1 && ((x >= 0 && x <= 5) || (x >= 26 && x <= 31))) c = 'k';
          // corda em arco entre os postes
          const t = (x - 5) / 21;
          if (x > 4 && x < 27) {
            const sag = Math.round(Math.sin(t * Math.PI) * 5);
            if (y === 3 + sag) c = 'r';
            if (y === 4 + sag) c = 'R';
            // bandeirolas
            if ((x - 6) % 5 === 0 && y > 4 + sag && y <= 8 + sag) c = y - 4 - sag <= 2 ? 'g' : 'k';
          }
          // base
          if (y >= 62 && ((x >= 0 && x <= 5) || (x >= 26 && x <= 31))) c = 'k';
          row += c;
        }
        rows.push(row);
      }
      return rows.join('\n');
    })(),
  ],
};

/** Faroleiro-fantasma 16x24. */
export const GHOST: SpriteDef = {
  palette: { '.': null, k: '#2a3a4a', w: '#e6f0ff', W: '#bcd0ea', b: '#8aa4c8', y: '#ffe08a' },
  frames: [`
.....kkkkkk.....
....kyyyyyyk....
...kkkkkkkkkk...
...kwwwwwwwwk...
..kwwkwwwwkwwk..
..kwwwwwwwwwwk..
..kwwwwkkwwwwk..
..kwwwwwwwwwwk..
.kwwwwwwwwwwwwk.
.kwwwwwwwwwwwwk.
.kwWwwwwwwwwWwk.
.kwWWwwwwwwWWwk.
.kWWWWwwwwWWWWk.
.kWWWWWWWWWWWWk.
..kWWWWWWWWWWk..
..kWbWWWWWWbWk..
..kWbWWbbWWbWk..
...kWbWbbWbWk...
...kWWWbbWWWk...
....kWWbbWWk....
....kbWbbWbk....
.....kbkkbk.....
......k..k......
................`, `
................
.....kkkkkk.....
....kyyyyyyk....
...kkkkkkkkkk...
...kwwwwwwwwk...
..kwwkwwwwkwwk..
..kwwwwwwwwwwk..
..kwwwwkkwwwwk..
..kwwwwwwwwwwk..
.kwwwwwwwwwwwwk.
.kwwwwwwwwwwwwk.
.kwWwwwwwwwwWwk.
.kwWWwwwwwwWWwk.
.kWWWWwwwwWWWWk.
.kWWWWWWWWWWWWk.
..kWWWWWWWWWWk..
..kWbWWWWWWbWk..
..kWbWWbbWWbWk..
...kWbWbbWbWk...
...kWWWbbWWWk...
....kWWbbWWk....
.....kbbbbk.....
......kkkk......
................`],
};

export const SIGN: SpriteDef = {
  palette: { '.': null, k: '#2a1a08', p: '#a8844a', P: '#8a6a3a', d: '#5f4630' },
  frames: [`
kkkkkkkkkkkkkkkk
kppppppppppppppk
kpddddddddddddpk
kpdpppppppppppPk
kpddddddddddddpk
kpdpppppppppppPk
kpddddddddddddpk
kpPPPPPPPPPPPPpk
kkkkkkkkkkkkkkkk
......kppk......
......kppk......
......kppk......
......kppk......
......kppk......
......kppk......
......kkkk......`],
};
