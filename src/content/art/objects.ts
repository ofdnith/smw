/** Objetos: plataformas, mola, canhão, porta, serra, vagonete, nó de corda. */
import type { SpriteDef } from '../../engine/sprites';

export const OBJECTS: Record<string, SpriteDef> = {
  platform: {
    palette: { '.': null, k: '#2a1a08', p: '#a8844a', P: '#8a6a3a', r: '#c9a66b' },
    frames: [`
kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
kppppppppppppppppppppppppppppppk
kpPppPppPppPppPppPppPppPppPppPpk
kPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPk
kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
..kr..........................rk
...kr........................rk.
....kkkkkkkkkkkkkkkkkkkkkkkkkk..`],
  },
  fallPlatform: {
    palette: { '.': null, k: '#3a2a1a', p: '#c8b08a', P: '#a08a68', d: '#6a5a48' },
    frames: [`
kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
kppppppppppppppppppppppppppppppk
kpPpdpPpPpdpPpPpdpPpPpdpPpPpdPpk
kPPPdPPPPPdPPPPPdPPPPPdPPPPPdPPk
kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
..kdk....kdk....kdk....kdk....k.
...k......k......k......k.......
................................`],
  },
  spring: {
    palette: { '.': null, k: '#3a1a28', p: '#f5b7c8', P: '#d98aa3', w: '#fff0f5', s: '#8a8a9a' },
    frames: [`
..kkkkkkkkkkkk..
.kpwwppppppppPk.
.kppppppppppPPk.
..kkkkkkkkkkkk..
....ks.ks.ks....
....sk.sk.sk....
....ks.ks.ks....
...kkkkkkkkkkk..
...kssssssssk...
...kkkkkkkkkk...`, `
................
................
................
................
..kkkkkkkkkkkk..
.kpwwppppppppPk.
.kppppppppppPPk.
..kkkkkkkkkkkk..
...kssssssssk...
...kkkkkkkkkk...`],
  },
  cannon: {
    palette: { '.': null, k: '#2a1a08', s: '#d9c9a8', S: '#b8a888', d: '#5a4a35' },
    frames: [`
....kkkkkkkk....
..kkssssssssk...
.kssSSSSSSSSsk..
kssSddddddddSskk
kssSddddddddSskk
kssSddddddddSsk.
.ksSSSSSSSSSsk..
..kkssssssssk...
...kkkkkkkkkk...
..kSSSSSSSSSSk..
.kSSkkkkkkkkSSk.
.kSk........kSk.
kSSk........kSSk
kSSk........kSSk
kkkk........kkkk
................`, `
....kkkkkkkk....
..kkssssssssk...
.kssSSSSSSSSskk.
kssSddddddddSsdk
kssSddddddddSsdk
kssSddddddddSsdk
.ksSSSSSSSSSskk.
..kkssssssssk...
...kkkkkkkkkk...
..kSSSSSSSSSSk..
.kSSkkkkkkkkSSk.
.kSk........kSk.
kSSk........kSSk
kSSk........kSSk
kkkk........kkkk
................`],
  },
  door: {
    palette: { '.': null, k: '#2a1a08', p: '#a8844a', P: '#8a6a3a', d: '#5f4630', y: '#ffd24a' },
    frames: [`
....kkkkkkkk....
..kkppppppppkk..
.kppppppppppppk.
kppPPPPPPPPPPppk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPdddddddddyPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPddddddddddPpk
kpPPPPPPPPPPPPpk
kkkkkkkkkkkkkkkk`, `
....kkkkkkkk....
..kkppppppppkk..
.kppppppppppppk.
kppPPPPPPPPPPppk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPyyyyyyyyyyPpk
kpPPPPPPPPPPPPpk
kkkkkkkkkkkkkkkk`],
  },
  saw: {
    palette: { '.': null, k: '#2a1a08', s: '#c8b08a', S: '#8a6a3a', w: '#e8d8b8' },
    frames: [`
....k....k....k.
.k.kskk.ksk..k..
..kssssssssskk..
.kssSSSSSSSsssk.
kksSSwwwwSSSssk.
.ksSSwwwwwwSSsk.
.ksSSwwwwwwSSskk
kksSSwwwwwwSSsk.
.ksSSwwwwwwSSsk.
.kssSSwwwwSSsskk
kksssSSSSSSsssk.
..kkssssssssk...
.k..kskk.ksk.k..
....k....k....k.
................
................`, `
.k....k....k....
..k..ksk.kksk.k.
..kkssssssssk...
.ksssSSSSSSSssk.
.kssSSSwwwwSSskk
kksSSwwwwwwSSsk.
.ksSSwwwwwwSSsk.
.ksSSwwwwwwSSskk
kksSSwwwwwwSSsk.
.kssSSwwwwSSssk.
.kkssSSSSSSsskk.
..kssssssssskk..
.k.kskk.ksk..k..
....k....k....k.
................
................`],
  },
  minecart: {
    palette: { '.': null, k: '#2a1a08', m: '#8a6a4a', M: '#5f4630', s: '#8f8f9a', S: '#60606a', w: '#f0ece0' },
    frames: [`
kkkkkkkkkkkkkkkkkkkkkkkk
kmmmmmmmmmmmmmmmmmmmmmmk
kmMMMMMMMMMMMMMMMMMMMMmk
kmMmmmmmmmmmmmmmmmmmmMmk
kmMmmmmmmmmmmmmmmmmmmMmk
kmMMMMMMMMMMMMMMMMMMMMmk
.kkkkkkkkkkkkkkkkkkkkkk.
...kssk..........kssk...
..kswssk........kswssk..
..ksSSsk........ksSSsk..
...kkkk..........kkkk...
........................
........................
........................
........................
........................`, `
kkkkkkkkkkkkkkkkkkkkkkkk
kmmmmmmmmmmmmmmmmmmmmmmk
kmMMMMMMMMMMMMMMMMMMMMmk
kmMmmmmmmmmmmmmmmmmmmMmk
kmMmmmmmmmmmmmmmmmmmmMmk
kmMMMMMMMMMMMMMMMMMMMMmk
.kkkkkkkkkkkkkkkkkkkkkk.
...kssk..........kssk...
..kssSsk........kssSsk..
..kSwSsk........kSwSsk..
...kkkk..........kkkk...
........................
........................
........................
........................
........................`],
  },
  knot: {
    palette: { '.': null, k: '#3a2a10', r: '#c9a66b', R: '#a8844a' },
    frames: [`
..kkkk..
.krrrrk.
krrRRrrk
krRRRRrk
krrRRrrk
.krrrrk.
..kkkk..
...kk...`],
  },
};
