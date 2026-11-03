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

## 2026-11-02 — v1.3: console virtual de 16 bits (F0–F2 do plano de fidelidade)
Pedido: deixar o jogo "muito próximo aos games de Super Nintendo" em todas as vertentes. Montei o plano (`docs/PLANO-16BIT.md`) e executei as três primeiras fases, que são a base de todo o resto.

**Som (F2)**: o sintetizador de ondas de 8 bits virou um chip de samples.
- `adpcm.ts`: codec de 4 bits nosso (bloco de 16 samples em 9 bytes, 4 preditores com coeficientes próprios); 49 dB de SNR num seno.
- `instruments.ts`: 30 instrumentos por síntese offline a 32 kHz (aditiva com loop perfeito, parciais inarmônicas, ruído com PRNG fixo): flauta, ocarina, metais, acordeão, cordas, coro, órgão, harpa, violão, pizzicato, baixo, slap, marimba, steel drum, sino, celesta, piano elétrico e um kit de bateria com 11 peças. 285 KB comprimidos; gerados aos poucos depois do primeiro gesto.
- Eco com realimentação filtrada, pan e envio por canal; os efeitos sonoros "roubam" as vozes 7 e 8 enquanto tocam.
- Cada música foi orquestrada por ilha (steel drum na praia, acordeão no navio, órgão nos fortes, coro no vale) com dobra de melodia onde cabia. Mixagem refeita com `tools/render-music.mjs` (render offline no Chromium; alvo −20 dB RMS).
- Não consigo ouvir daqui: o portão da F2 é a audição do dono do projeto.

**Vídeo (F1)**
- Quadro 256×224. 55 das 70 salas já tinham 14 tiles de altura e agora aparecem inteiras; chefes que usavam `camX + 320` passaram a usar `VIEW_W`.
- Todas as cores passam por RGB555 (`console.ts`); sprites são encaixados em 15 cores por sub-paleta.
- Céus por linha de varredura (HDMA) em vez de faixas; água ondula linha a linha; fades viraram mosaico + brilho em 16 degraus.
- Fonte em negrito com sombra (glifos 5×7 engrossados para 6×7).
- Todas as telas de interface reorganizadas para o quadro novo (seleção de arquivo, opções, extras, galeria, sala de som, pausa, créditos, cutscene, título). `?ui=<tela>` abre cada uma direto.
- Corrigido: o nome da fase cobria a placa de tutorial no começo das fases.

**Ferramentas (F0)**: `tools/capture.mjs` (capturas em resolução nativa, `--ui` para as telas), `tools/fiscal.ts` + `tests/unit/hardware.test.ts` (cores por sprite, memória de som, vozes), `tools/render-music.mjs` (WAV e volume).

**Replays**: a câmera mais estreita muda quando inimigos acordam, então todos foram regerados; o bot terminou 24 fases (antes 23).

**Números**: 300 testes de unidade, 5 e2e, 24 replays; render ≤ 3,5 ms/quadro no pior caso medido (fase submersa).

**Próximo**: F3, a Ilha 1 inteira em 16 bits (Lumi com ~60 quadros desenhados à mão, tileset e fundos repintados para 256×224, fases refeitas, mini-chefe no forte). Precisa do playtest humano para fechar.

## 2026-11-03 — correções do primeiro playtest humano
Primeiro retorno de alguém jogando: "sprites teleportam ao virar" e "o jogo engasgou ao entrar na água na primeira fase".

**Espelhamento (o "teleporte")**: desde a v1.2, espelhar um sprite também espelhava a âncora (`ox` virava `w-1-ox`), então **todo** sprite olhando para a esquerda desenhava `w-1` px fora do corpo físico — a Lumi (16 px de largura) pulava 15 px ao virar, e inimigos andando para a esquerda ficavam com o visual deslocado da hitbox (pisões pareciam injustos). O espelhamento agora é "no lugar": o conteúdo inverte dentro da própria caixa e a âncora não muda (`compileFrame`). Os acessórios de poder (concha, folha, lanterna), que compensavam o defeito no olho, foram reposicionados pela conta certa de espelho; o olho da Bolota já usava a conta certa. Conferido com capturas olhando para os dois lados.

**Engasgo na água**: a síntese dos instrumentos rodava na thread principal (até 57 ms por instrumento, ~850 ms no total). Passando rápido pelo título, a geração continuava durante o jogo; e a primeira nota de um instrumento ainda não pronto (o splash ao mergulhar, por exemplo) gerava o sample na hora, travando o quadro e atrasando o agendamento de notas (o "bufo" no áudio). Agora:
- `instrumentWorker.ts`: o banco inteiro nasce num **Web Worker** (ordem de prioridade: efeitos e bateria primeiro), com o PCM transferido sem cópia;
- enquanto o worker trabalha, nota de instrumento ausente é **pulada** em vez de gerada na hora (a voz entra sozinha em <1 s);
- destravar o áudio caiu de 216 ms para 29 ms, zero *long tasks*, splash + filtro de mergulho em 1 ms;
- o render offline (`render-music.mjs`) continua gerando por demanda (sem worker) — conferido que não sai WAV mudo;
- `setUnderwater` só agenda o filtro quando o estado muda (era chamado todo frame);
- `waveLines` desenha faixas de linhas com o mesmo deslocamento em vez de linha a linha (render de 4-2: 3,4 → 2,2 ms).

**Pendente**: a arte em si continua a da v1.2 — refazer tudo em pixel art de autoria é a F3 (`docs/PLANO-16BIT.md`). A audição da trilha nova (portão da F2) também segue pendente.

**Números**: 300 testes, 5 e2e, 24 replays, tudo verde.
