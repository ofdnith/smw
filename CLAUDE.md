# Regras do projeto — Lumi e o Arquipélago dos Faróis

Leia `docs/PLANO.md` antes de qualquer tarefa. Ele é a fonte de verdade de design e arquitetura; `docs/diario.md` é onde paramos.

## Originalidade (inegociável)
- Nunca use nomes, personagens, inimigos, itens, músicas, sprites, tiles ou layouts de jogos existentes (Nintendo ou outros). Mecânicas de gênero são livres; conteúdo não.
- Nunca copie constantes de física de desmontagens/ROMs. Os números são nossos e vivem em `docs/fisica.md`.
- Toda arte e som nasce em código neste repositório (sprites em texto, música em formato tracker). Nenhum binário de asset.
- Antes de criar um asset, aplique o teste: "alguém reconheceria isso como obra de outro jogo?" Se sim, refaça.

## Técnico
- TypeScript strict, zero `any`, zero dependências de runtime. Vite, Vitest, Playwright.
- Gameplay determinístico: floats com operações determinísticas e seno por tabela (`tsin`), PRNG com seed, nada de `Math.random`/`Date` dentro do mundo (`src/game/world.ts` e entidades). Replays em `tests/replays` provam isso; se mudar a física de propósito, regere com `npm run replays -- <fase>`.
- Timestep fixo de 60 Hz; render interpolado.
- Resolução lógica 320×180, escala inteira, `image-rendering: pixelated`.

## Fluxo
- `main` sempre jogável; CI roda lint, typecheck, testes, build e e2e a cada push, e o Pages publica a `main`.
- Fases novas: escreva com a DSL de `src/content/levels/dsl.ts` (ou rascunhe no editor, `?editor`) e rode o validador de alcance (`tests/unit/reach.test.ts`). Ids de fase nunca mudam (saves dependem deles); o número exibido no mapa é `label`.
- Commits pequenos, em português.
- Antes de dizer que algo está pronto: `npm run check`, `npm run build`, `npm run e2e`, e conferir screenshot (`tools/sheet.mjs`, `tools/shot.mjs`).
- Toda sessão termina com uma entrada em `docs/diario.md`.
