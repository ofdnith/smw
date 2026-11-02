# Regras do projeto — Lumi e o Arquipélago dos Faróis

Leia `docs/PLANO.md` antes de qualquer tarefa. Ele é a fonte de verdade de design e arquitetura; `docs/diario.md` é onde paramos.

## Originalidade (inegociável)
- Nunca use nomes, personagens, inimigos, itens, músicas, sprites, tiles ou layouts de jogos existentes (Nintendo ou outros). Mecânicas de gênero são livres; conteúdo não.
- Nunca copie constantes de física de desmontagens/ROMs. Os números são nossos e vivem em `docs/fisica.md`.
- Toda arte e som nasce em código neste repositório (sprites em texto, música em formato tracker). Nenhum binário de asset.
- Antes de criar um asset, aplique o teste: "alguém reconheceria isso como obra de outro jogo?" Se sim, refaça.

## Técnico
- TypeScript strict, zero `any`, zero dependências de runtime. Vite, Vitest, Playwright.
- Gameplay determinístico: física em ponto fixo (1/256 px), PRNG com seed, nada de `Math.random`/`Date` em `src/game`.
- Timestep fixo de 60 Hz; render interpolado.
- Resolução lógica 320×180, escala inteira, `image-rendering: pixelated`.

## Fluxo
- Branch por marco (`mN-nome`), PR para `main`. `main` sempre jogável.
- Commits pequenos, em português.
- Antes de dizer que algo está pronto: `npm run check` (lint + typecheck + unit + replays), build, abrir no Chromium headless e conferir screenshot.
- Toda sessão termina com uma entrada em `docs/diario.md`.
