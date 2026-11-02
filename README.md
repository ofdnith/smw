# Lumi e o Arquipélago dos Faróis

Um platformer 2D original no espírito dos clássicos de 16 bits: corrida com impulso, pulo variável, cambalhota, montaria, mapa-múndi com saídas secretas, fortes, faróis com chefes e segredos em toda parte. Personagens, arte, música, efeitos e fases são 100% inéditos e **feitos em código** — não há um único arquivo de imagem ou áudio no repositório.

**Jogar agora:** https://ofdnith.github.io/smw/

## História
O Arquipélago Vela é guiado por sete faróis. Numa noite sem lua, a Neblina Maré engoliu as chamas e os navios pararam de chegar. Lumi, aprendiz da faroleira Dona Ondina, parte para reacender cada farol — e descobre que a neblina obedece ao Capitão Brumo, um ex-faroleiro que quer o arquipélago escuro para que ninguém mais vá embora.

## Controles
| Ação | Teclado | Controle |
|---|---|---|
| Mover | Setas / WASD | D-pad / analógico |
| Pulo (segure para pular mais alto) | Z / Espaço / K | A / Cruz |
| Correr · carregar · atirar (Lanterna) | X / Shift / J | X / Quadrado |
| Cambalhota · desmontar | C / L | B / Círculo |
| Item reservado | V / I | Select |
| Pausa / confirmar | Enter / Esc | Start |
| Painel de depuração | F1 (F2–F7 ajustam física) | |
| Gravar replay da fase | F8 | |

Pulo, correr, cambalhota, item e pausa podem ser trocados em **Opções** (na seleção de arquivo ou na pausa), tanto no teclado quanto no controle. Em celulares, os controles de toque aparecem automaticamente.

## O jogo
- **7 ilhas + Rota das Constelações**: Praia do Sino, Bosque Encharcado, Penhasco dos Ventos, Recife Profundo, Minas de Sal, Vale Sem Lua, Farol Mestre — **59 fases**: 36 normais, 2 secretas, 6 fortes, 7 faróis com chefe (o último é o confronto final) e 8 desafios.
- **Poderes**: Concha-Escudo, Folha de Vento (planar, rajada e voo com ímpeto), Lanterna Viva (orbes de luz revelam blocos invisíveis).
- **Bolota**, o besouro montaria: pulo duplo, rolagem que quebra blocos, variantes Pedra e Seda.
- **Pérolas da Maré**: 3 por fase, escondidas. **Nove saídas secretas** abrem caminhos novos no mapa e a Rota das Constelações.
- **Tenda da Ondina** (escolha uma concha) e **Cassino de Conchas** (jogo da memória por 10 âmbar) no mapa.
- **Extras**, desbloqueados pelas pérolas: **Galeria** (10), **Sala de Som** (25), **Contra-relógio** (40, com recordes) e o **Editor de Fases** (sempre aberto).
- Trilha sonora com 19 temas originais, mixados no mesmo volume, e ~45 efeitos gerados por um sintetizador próprio (Web Audio).
- Save em 3 arquivos, modo assistido, controles de toque, gamepad e remapeamento.

## Arte
Toda a arte nasce em código, sem nenhum arquivo de imagem: um pequeno escultor de pixel art (`src/engine/pixelart.ts`) desenha formas com rampas de 5 tons, luz de cima-esquerda, sombras frias e brilhos quentes, e contorno escuro seletivo — o acabamento típico dos sprites de 16 bits. Sprites (`src/content/art/`), tiles (`tilesets.ts`), fundos com parallax (`src/game/render/backgrounds.ts`) e o mapa-múndi (`src/game/render/worldmapArt.ts`) usam o mesmo sistema. Para revisar sprites ampliados: `npx vite-node tools/preview-art.ts enemies saida.png 6` (grupos: lumi, bolota, enemies, bosses, items, objects, misc, map).

## Editor de fases
Abra **Extras → Editor de Fases** (ou `?editor`, ou `?editor=2-1` para partir de uma fase existente).
Botão esquerdo pinta, direito apaga, roda rola. `Q`/`E` trocam a peça, `TAB` a categoria, `M` o tema, `[ ]` e `- =` mudam o tamanho, `G` a grade.
`T` testa do início, `Y` testa a partir do cursor, `P` exporta (baixa um JSON e copia as linhas no formato das fases), `ESC` volta. O rascunho fica salvo no navegador.

## Desenvolvimento
```
npm install
npm run dev        # http://localhost:5173
npm run check      # lint + typecheck + 223 testes: física, mecânicas, chefes, alcançabilidade das 59 fases, replays, música, extras
npm run e2e        # fluxo completo no Chromium headless, incluindo replays com o mesmo hash do Node
npm run build      # dist/ (publicado automaticamente no GitHub Pages)
npm run replays    # regera os replays de regressão (tests/replays) com o bot
```
Ferramentas: `node tools/bot.mjs 1-1` (bot joga uma fase no navegador), `node tools/sheet.mjs 2-1 out.png` (folha de contato), `node tools/shot.mjs "level=3-2" 60 out.png` (captura), `node tools/loudness.mjs` (volume de cada música).

**Replays:** cada arquivo em `tests/replays` guarda só a entrada quadro a quadro de uma partida. Se a física, a colisão ou uma fase mudarem, o hash do estado final muda e o teste aponta. Mudança intencional? `npm run replays -- <fase>`.

Atalhos de URL para testar: `?level=4-2` abre uma fase; `?ta=4-2` abre o contra-relógio dela; `?map&cleared=1-1,1-2` abre o mapa com fases concluídas; `?editor` abre o editor; `?art=0` mostra toda a arte.

## App para Mac (opcional)
O workflow **App para macOS (Tauri)** (`.github/workflows/mac.yml`) compila um `.app`/`.dmg` nativo num runner macOS do GitHub Actions — rode-o pela aba *Actions* (botão *Run workflow*) ou crie uma tag `v*` — nesse caso o `.dmg` é anexado automaticamente a uma release em https://github.com/ofdnith/smw/releases. O ícone é gerado na hora a partir do sprite da Lumi (`tools/icon.mjs`). Requer Rust no runner (já incluído no workflow).

## Documentos
- [`docs/PLANO.md`](docs/PLANO.md) — plano de design e arquitetura
- [`docs/fisica.md`](docs/fisica.md) — números finais da física e regras de design
- [`docs/diario.md`](docs/diario.md) — diário de desenvolvimento

## Stack
TypeScript · Vite · Canvas 2D (320×180) · Web Audio · Vitest · Playwright · zero dependências de runtime.
