# Diário de desenvolvimento

## 2026-11-02 — Planejamento
- Repositório criado vazio. Escrito `docs/PLANO.md` (design + arquitetura + roadmap), `CLAUDE.md` (regras) e `README.md`.
- Decisões: jogo original chamado **Lumi e o Arquipélago dos Faróis**; estrutura e sensação de platformer 16 bits, conteúdo 100% nosso; stack TypeScript/Vite/Canvas 2D; arte e música em código.

## 2026-11-02 — M0 a M8 numa sessão (v1.0)
Com autonomia total, os marcos foram executados em sequência, direto na `main` (sem PRs, já que não havia revisor).

**Motor**
- Loop de timestep fixo 60 Hz com render interpolado; buffer 320×180 escalado por inteiro.
- Entrada por máscara de bits (teclado, Gamepad API, toque) com `override` para replays/testes.
- Sprites em texto compilados para canvas em memória; fonte bitmap 5×7 própria; tilesets procedurais por tema (10 temas) com auto-tiling; fundos com parallax desenhados por código.
- Áudio: sintetizador (pulsos 12/25/50%, triângulo, serra, ruído, ADSR, vibrato, filtro) + sequenciador em formato tracker + ~45 SFX paramétricos. Filtro passa-baixa debaixo d'água; camada de percussão extra ao montar na Bolota.
- Decisão: em vez de ponto fixo 1/256, usei floats com operações determinísticas (IEEE 754 é igual em todo motor) e seno por tabela; o determinismo foi comprovado pelos testes de simulação.

**Jogo**
- Lumi: andar/correr/ímpeto, pulo variável com coyote e buffer, cambalhota, carregar/chutar/arremessar, agachar, deslizar em rampas, nadar, escalar cordas e redes, planar/rajada/voo (Folha), orbes (Lanterna), montaria (Bolota: pulo duplo, rolagem que quebra blocos e sobe degraus, fuga ao levar dano, skins Pedra/Seda).
- Colisão com tiles: AABB por eixo, rampas 45° e 22,5° com "grude" na descida, plataformas atravessáveis, teto que bate em blocos, água, vento, esteiras, gelo.
- 13 inimigos originais, 7 chefes, 8 objetos (plataformas móveis/que caem, mola, canhão, corda de balanço, serra, vagonete, porta).
- Cenas: título, seleção de 3 arquivos, mapa-múndi com caminhos que se revelam e névoa nas ilhas fechadas, fase com HUD, pausa com opções, Tenda da Ondina, cutscenes, game over, créditos.
- 39 fases em 7 ilhas + 4 desafios, escritas numa mini-DSL de segmentos (`src/content/levels/dsl.ts`).

**Qualidade**
- `tests/unit/physics` (pulo, rampas, blocos, pisões), `mechanics` (Bolota, Folha, Lanterna, chave/fechadura, portas, checkpoint, água, escada), `bosses` (os 7 chefes derrotados por políticas simuladas), `reach` (validador BFS de alcançabilidade: fim, checkpoints, pérolas e saídas secretas de todas as fases), `music` (todas as faixas fazem parse), `levels` (integridade do mapa e das fases).
- `tests/e2e/flow.spec.ts`: título → arquivo → mapa → fase → fim → mapa; último farol → cutscene → créditos; todas as fases rodam 300 frames sem erro.
- Ferramentas: `tools/bot.mjs` (bot heurístico), `tools/sheet.mjs` (folha de contato), `tools/shot.mjs`, `tools/audiotest.mjs`.
- CI: lint, typecheck, unit, build, e2e. Deploy automático no GitHub Pages via branch `gh-pages`.

**Ajustes feitos a partir dos testes**
- Pulo parado subiu de 2,4 para 3,1 tiles (blocos a 4 tiles do chão eram inalcançáveis).
- Rampas: faltava checar o tile acima dos pés ao entrar numa rampa por baixo.
- Planar: a gravidade vencia o limite de queda; agora o planar aproxima a velocidade de 0,9 px/f diretamente.
- Vários trechos de fase redesenhados pelo validador (torres altas demais, pérolas no teto, fossos sem saída).
- Chefes: Rei Siri solta caranguejos por trás; Medusa flutua acima da cabeça de Lumi e avisa antes de acender; Velha Broca não é espinhosa durante a investida; Sombra redesenhada (segue os passos de Lumi pelo chão em vez de replay exato, que era injusto); chefe recém-atingido não revida.

**Pendências para depois do playtest humano**
- Sensação do pulo/corrida (só é possível julgar jogando).
- Mixagem da trilha (volumes relativos entre canais).
- Mais decoração nas arenas de chefe.
- Empacotamento nativo para Mac (M10): configuração Tauri + workflow `mac.yml` prontos, mas só podem ser executados num runner macOS (não verificado aqui).
