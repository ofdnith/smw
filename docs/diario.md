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

## 2026-11-02 — v1.1: plano concluído
Pedido: terminar o projeto inteiro, sem pausas para aprovação. Levantei o que faltava frente ao `PLANO.md` e fechei tudo.

**Conteúdo**
- **20 fases novas** (59 no total), em `src/content/levels/expansion.ts`: Molhe dos Pescadores; Cogumelos Saltitantes e Tronco Oco; Ponte de Corda, Escarpa (vertical) e Vendaval (vento contra); Praia de Conchas, Abismo Azul (submerso e escuro) e Maré Alta; Esteiras de Sal, Poço de Sal (descida cavando) e Trilho Duplo; Pântano de Névoa e Caminho das Lâmpadas; Velas Rasgadas (rolagem automática) e Porão Inundado; Aurora, Eclipse, Nebulosa e Supernova na Rota das Constelações.
- Saídas secretas conforme o plano (1/2/1/2/2/1 por ilha): 2-7, 4-7 e 5-7 abrem C-5 a C-7; C-8 exige C-7.
- Ids novos não colidem com os antigos (saves continuam válidos); o número exibido vem de `label` (`levelLabel()`), e fortes/faróis aparecem como FORTE/FAROL.
- Mapa redesenhado para caber os nós (ilhas 1, 2, 4, 5 e 8 cresceram). Conferido por screenshot: nenhum nó sobreposto.
- **Cassino de Conchas** (jogo da memória, 10 âmbar a rodada, 4 erros) em três ilhas.
- Três músicas próprias: Navio-Fantasma (cantiga em ré menor), Grutas (sinos com eco) e Cassino (valsinha em fá) — antes eram cópias de outras faixas.

**Sistemas**
- **Extras** na seleção de arquivo: Galeria (35 entradas), Sala de Som (19 faixas + efeitos, com visualizador), Contra-relógio (não toca no arquivo; morrer reinicia; recordes em `save.records`) e Editor de Fases.
- **Opções** (seleção de arquivo e pausa) com **remapeamento** de tecla e botão de controle para pulo, correr, cambalhota, item e pausa. A pausa passou a usar identificadores em vez de índices fixos.
- **Editor de fases** (`src/tools/editor.ts`): pinta com tiles e sprites reais, testa do início ou do cursor (no modo contra-relógio), exporta JSON e linhas.
- **Replays determinísticos** (`src/game/replay.ts`): bot headless (`src/tools/bot.ts`) gerou 19 replays que terminam fases de todas as ilhas, incluindo os chefes Velha Broca e Sombra. O teste de unidade confere o hash; o e2e confere que o Chromium chega ao mesmo hash do Node. F8 grava um replay dentro do jogo.
- **Mixagem**: `tools/loudness.mjs` mede o RMS de cada música no Chromium; ganhos por faixa levaram a diferença de 8 dB para ±1 dB (alvo −14 dB, chefes −13 dB).
- Escala fracionária em telas pequenas e nitidez em telas de alta densidade.

**Correções**
- Pular **por cima** do arco de chegada deixava a fase sem fim (a Lumi ficava presa no fim do mapa). Agora cruzar o arco em qualquer altura conta, com o bônus máximo. Achado pelo bot em 7-4; teste em `mechanics.test.ts`.
- Nomes longos de ilha encostavam no contador de pérolas do mapa.
- Abismo Azul ganhou lâmpadas de coral (só a luz da Lumi não bastava).

**Números**: 223 testes de unidade, 5 cenários e2e, 59 fases validadas por alcance, 19 replays.

**Pendente (depende de gente jogando)**: sensação do pulo e curva de dificuldade das fases novas.

## 2026-11-02 — v1.2: arte nova e colisões mais justas
Pedido: "o jogo está feio" — melhorar todos os sprites, as ilhas e as colisões. (Também perguntou por que os sprites não são iguais aos de Super Mario World: não podem ser, por serem obra da Nintendo; o alvo passou a ser o *padrão de qualidade* de 16 bits, com arte própria.)

**Diagnóstico**: sprites pequenos e de cor chapada, chão de cor única com ruído, fundos de retângulos, mapa de elipses lisas, fases escuras quase pretas.

**Arte**
- `src/engine/pixelart.ts`: escultor de pixel art — elipses, retângulos arredondados, polígonos e linhas com rampas de 5 tons geradas por cor base (sombras puxadas para o azul, brilhos para o amarelo), luz de cima-esquerda, contorno seletivo, camadas com contorno próprio (braços e cabeça destacados do corpo), pixels de tinta para olhos. `canvasToFrame` gera imagens grandes direto em pixels.
- Lumi em 19 poses paramétricas (pernas, braços, rosto, inclinação); capa recolorida por poder. Bolota, 20 inimigos, chefes (a Sombra reaproveita a Lumi com paleta de breu e contorno vermelho), itens, objetos, Dona Ondina, farol e ícones do mapa. Mesmas dimensões e âncoras de antes, então nada desalinhou.
- Gaivota e lesma antigas olhavam para o lado errado; corrigido de graça.
- Tiles: contorno nas bordas expostas, grama/areia caindo sobre o barranco, cantos arredondados, textura contínua por ilha, blocos com bisel e brilho, água com espuma, lava e névoa animadas.
- Fundos em faixas esculpidas com parallax, preenchendo até o pé da tela em salas altas.
- Mapa-múndi pré-esculpido: costa irregular, água rasa com espuma, planalto com paredão, decoração temática que evita nós e caminhos; névoa que segue a costa.
- Fases escuras um pouco menos escuras (88% em vez de 94%) para o cenário aparecer; a lanterna continua necessária.
- `tools/preview-art.ts` renderiza qualquer grupo de sprites ampliado; foi assim que cada sprite foi revisado.

**Colisões** (detalhes em `docs/fisica.md`)
- Correção de quina (4 px), ajuda na borda (5 px), área de dano menor que o corpo, espinhos e névoa só onde há arte.
- Defeito antigo corrigido: o corpo entrava até 1 px nas paredes à direita.
- Replays regerados: o bot agora termina 23 fases (antes 19), inclusive o Barão Cata-Vento.

**Números**: 239 testes de unidade, 5 e2e, 23 replays.
