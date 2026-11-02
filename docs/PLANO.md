# Lumi e o Arquipélago dos Faróis — Plano de Desenvolvimento

> **Estado: v1.1 — plano concluído.** Jogável em https://ofdnith.github.io/smw/ e como app de macOS (release `.dmg`). M0 a M10 feitos; ver `docs/diario.md` para as decisões e `docs/fisica.md` para os números finais.
>
> **Onde o resultado difere do plano original:**
> - Física em *floats* determinísticos (IEEE 754 + seno por tabela) em vez de ponto fixo 1/256 — o determinismo é provado por replays que dão o mesmo hash no Node e no Chromium.
> - **59 fases** em vez de ~68: 36 normais, 2 secretas, 6 fortes, 7 faróis (o último é o chefe final) e 8 desafios. A conta "68" do §6.1 somava fortes e faróis duas vezes; as quantidades por ilha da tabela foram cumpridas (a Ilha 7 vai direto ao Farol Mestre, sem forte).
> - Fortes têm armadilhas e marujos em vez de um mini-chefe próprio; cada farol tem seu chefe.
> - "Pontes de corda" do mapa viraram as saídas secretas que abrem a Rota das Constelações e as Tendas da Ondina.
> - Trabalho direto na `main` (sem PRs, pois não havia revisor), com CI a cada push.

> Um platformer 2D original, feito do zero, que parte da *sensação* dos grandes platformers de 16 bits (corrida com impulso, pulo variável, mapa-múndi com caminhos secretos, montaria, segredos em toda parte), mas com personagens, mundo, arte, música e fases 100% inéditos.

Codinome do repositório: `smw` (de *"super mundo"*). Nome do jogo: **Lumi e o Arquipélago dos Faróis**.

---

## Sumário

1. [Regras de originalidade](#1-regras-de-originalidade)
2. [Visão e pilares](#2-visão-e-pilares)
3. [Mundo, história e personagens](#3-mundo-história-e-personagens)
4. [Mecânicas: especificação de jogo](#4-mecânicas-especificação-de-jogo)
5. [Inimigos e chefes](#5-inimigos-e-chefes)
6. [Estrutura do mundo e das fases](#6-estrutura-do-mundo-e-das-fases)
7. [Arquitetura técnica](#7-arquitetura-técnica)
8. [Pipeline de conteúdo (arte, som, fases)](#8-pipeline-de-conteúdo)
9. [Qualidade, testes e CI](#9-qualidade-testes-e-ci)
10. [Roadmap por marcos](#10-roadmap-por-marcos)
11. [Riscos e mitigação](#11-riscos-e-mitigação)
12. [Como eu vou trabalhar neste repositório](#12-como-eu-vou-trabalhar-neste-repositório)

---

## 1. Regras de originalidade

Estas regras valem para todo arquivo do repositório e não são negociáveis.

| Pode | Não pode |
|---|---|
| Mecânicas de gênero: correr, pular, pisar em inimigos, blocos com itens, mapa-múndi, fases secretas, montaria | Nomes, personagens, inimigos, itens ou lugares de qualquer jogo da Nintendo (ou de qualquer outra empresa) |
| Física ajustada "no feeling", com números nossos | Constantes copiadas de desmontagem/ROM ou de documentação de engenharia reversa |
| Pixel art desenhada por nós (em código, ver §8) | Sprites, tiles, paletas ou layouts de fase recriados a partir de jogos existentes |
| Música e efeitos sonoros compostos por nós | Melodias, jingles ou efeitos transcritos ou "parecidos de propósito" |
| Paleta e resolução próprias (320×180, 16:9) | Imitar a moldura/estilo visual de uma obra específica |

**O alvo é um jogo que, na mão, lembre fortemente um platformer clássico de 16 bits em tudo o que é *estrutura e sensação*** — mapa-múndi com caminhos e saídas secretas, corrida com impulso, pulo variável, giro, montaria, blocos, fortalezas no meio e castelo no fim de cada mundo, item reservado, casas de bônus — **e que, nos olhos e ouvidos, seja inconfundivelmente nosso**: cada sprite, tile, música e efeito sonoro é criado por mim em código, cada personagem e fase é inédito.

Teste de checagem para qualquer asset: *"Uma pessoa que conhece o jogo X olharia para isso e diria 'é o personagem/fase/música Y'?"* Se a resposta puder ser sim, refazemos.

---

## 2. Visão e pilares

**Pitch em uma frase:** Lumi, aprendiz de faroleira, atravessa sete ilhas reacendendo faróis apagados por uma neblina viva, correndo, planando e montada em um besouro rolante.

**Plataforma alvo:** navegador (desktop e mobile com controle) → jogável via GitHub Pages; empacotamento opcional como app nativo de macOS (Tauri) no marco final.

**Pilares**

1. **Movimento com impulso.** Andar é bom, correr é melhor, correr no máximo abre caminhos. Dominar o impulso é a curva de habilidade central.
2. **Segredos que recompensam curiosidade.** Toda fase tem pelo menos um segredo; metade das ilhas tem uma saída alternativa que muda o caminho no mapa.
3. **Leitura instantânea.** Silhuetas claras, paleta com contraste alto entre cenário e elementos interativos, nada mata o jogador sem aviso.
4. **Generoso nas bordas.** Coyote time, buffer de pulo, hitbox de dano menor que o sprite, checkpoint no meio de cada fase.
5. **Tudo em código.** Arte, som e fases vivem no repositório como texto versionável. Zero binário obrigatório.

**Fora de escopo (v1.0):** multiplayer, online, editor de fases para o jogador final (o editor existe, mas é ferramenta interna), dublagem.

---

## 3. Mundo, história e personagens

### 3.1 História

O Arquipélago Vela é guiado por sete faróis. Numa noite sem lua, a **Neblina Maré** (uma névoa que pensa) engole as chamas e os navios param de chegar. A velha faroleira Dona Ondina está doente demais para subir as escadas. Sua aprendiz, **Lumi**, pega a lanterna da torre e parte para reacender cada farol. No caminho, descobre que a neblina é comandada por **Capitão Brumo**, um ex-faroleiro que quer o arquipélago escuro para que ninguém mais vá embora.

Narrativa contada sem texto longo: cenas curtas de 3 a 5 quadros entre ilhas, balões com no máximo uma frase.

### 3.2 Personagens

| Personagem | Papel | Design |
|---|---|---|
| **Lumi** | Protagonista | Menina pequena (16×24 px), capa de chuva amarela, gorro azul-marinho com pompom, bota vermelha. Silhueta: triângulo da capa + pompom. |
| **Bolota** | Montaria | Besouro-rola-bosta redondo, casco verde-azulado iridescente. Rola, quebra blocos rachados, dá pulo duplo curto. Lumi o encontra preso num farol na Ilha 2. |
| **Dona Ondina** | Mentora | Aparece no início, entre ilhas (carta) e no final. |
| **Capitão Brumo** | Vilão | Homem alto feito de neblina dentro de um casaco de marinheiro vazio; só os olhos e o cachimbo são sólidos. |
| **Faroleiros-fantasma** | NPCs | Um por farol; dão dicas sobre o segredo da ilha depois que o farol é aceso. |

### 3.3 Itens e poderes (todos originais)

| Item | Efeito | Visual |
|---|---|---|
| **Concha-Escudo** | Estado "protegida": aguenta 1 dano extra. Lumi fica com uma concha nas costas. | Concha rosa-perolada |
| **Folha de Vento** | Planar segurando pulo (queda lenta), e "rajada": no ar, ↓+pulo dá um impulso para cima uma vez por pulo. | Folha grande verde-limão |
| **Lanterna Viva** | Atira orbes de luz que quicam no chão. Atordoam inimigos e **revelam blocos invisíveis** num raio pequeno. | Lanterna de vidro com chama azul |
| **Bolota** | Montaria (ver §4.6). | — |
| **Gota de Âmbar** | Moeda. 100 = 1 vida. | Gota laranja translúcida |
| **Pérola da Maré** | Colecionável grande, 3 por fase, escondidas. Liberam extras. | Pérola com brilho |
| **Pena de Gaivota** | Vida extra. | Pena branca e cinza |
| **Sino de Farol** | Checkpoint. Tocar = salva posição na fase. | Sino de bronze num poste |

Hierarquia de dano: Lanterna/Folha → (dano) → Concha → (dano) → normal → (dano) → perde vida. Pegar qualquer poder estando "normal" também dá a concha implícita? **Não**: cada poder já conta como 1 camada de proteção; a Concha é a camada base. Simples e legível.

---

## 4. Mecânicas: especificação de jogo

Unidades: **pixels por frame a 60 Hz**, com posição em ponto fixo de **1/256 px** (inteiros) para determinismo. Todos os números abaixo são o ponto de partida; o marco M2 é dedicado a ajustá-los jogando.

### 4.1 Movimento horizontal

| Parâmetro | Valor inicial |
|---|---|
| Velocidade máx. andando | 1,50 px/f |
| Velocidade máx. correndo (segurar Correr) | 2,60 px/f |
| Velocidade máx. em **Ímpeto** | 3,40 px/f |
| Aceleração andando / correndo | 0,055 / 0,075 px/f² |
| Desaceleração soltando (chão) | 0,060 px/f² |
| Freada (direção oposta, "skid") | 0,160 px/f², com poeira e som |
| Controle no ar | 75% da aceleração do chão |

**Medidor de Ímpeto:** 7 segmentos no HUD. Enche 1 segmento a cada 8 frames correndo acima de 2,4 px/f no chão; esvazia 1 a cada 4 frames fora disso. Cheio → velocidade de Ímpeto, pulo mais alto, Lumi deixa rastro de faíscas, e com a Folha de Vento consegue **voar baixo** por até 2 s.

### 4.2 Pulo

| Parâmetro | Valor inicial |
|---|---|
| Velocidade inicial | −4,80 px/f + 0,25 × \|vx\| |
| Gravidade segurando pulo (subindo) | 0,22 px/f² |
| Gravidade soltando ou caindo | 0,60 px/f² |
| Queda máxima | 4,50 px/f (planando: 0,90) |
| Coyote time | 6 frames |
| Buffer de pulo | 7 frames |
| Quique em inimigo | −3,8 (−5,2 segurando pulo) |

Resultado alvo: pulo mínimo ≈ 1,5 tile, pulo máximo parado ≈ 4 tiles, máximo em Ímpeto ≈ 5,5 tiles.

### 4.3 Cambalhota (ação secundária)

Botão próprio. Pulo um pouco mais baixo (−4,3) em giro. Durante o giro:
- quebra **blocos rachados** ao cair sobre eles;
- quica com segurança em inimigos com espinho em cima;
- elimina inimigos pequenos ao cair sobre eles (sem deixar casco/corpo);
- não pode carregar objetos.

### 4.4 Carregar e arremessar

Segurar Correr ao encostar em objeto carregável (inimigo atordoado, caixa, bomba-ouriço) → carrega à frente. Soltar → chuta horizontal (4 px/f). ↑ + soltar → arremessa para cima. ↓ + soltar → solta devagar.

### 4.5 Interações com o cenário

- **Blocos-baú** (`?` não; nosso símbolo é uma **estrela-do-mar gravada**): batidos por baixo liberam item.
- **Blocos rachados:** quebram com cabeçada estando protegida, com Cambalhota, com Bolota rolando ou casco chutado.
- **Blocos-farol** invisíveis: só a Lanterna Viva ou um Sino aceso revelam.
- **Rampas** de 22,5° e 45°, subidas e descidas; deslizar sentada ao apertar ↓ numa rampa (mata inimigos no caminho).
- **Plataformas** atravessáveis por baixo; ↓ + pulo desce por elas.
- **Água:** física própria (gravidade 0,08, nado por toques no pulo, máx. 1,2 px/f).
- **Cordas e redes:** escalar nos dois eixos.
- **Correntes de vento** (Ilha 3), **plataformas de maré** que sobem e descem (Ilha 4), **escuridão** com raio de luz (Ilha 6).

### 4.6 Bolota (montaria)

- Lumi monta pulando em cima. Desmonta com Cambalhota.
- Pulo de Bolota é 10% maior e tem **pulo duplo** curto (−3,2).
- ↓ + Correr: Bolota **rola** como bola, quebra blocos rachados, derruba inimigos, sobe paredes curtas (1 tile) com impulso.
- Se Lumi leva dano montada, Bolota foge correndo (dá para recuperar em 3 s), em vez de ela perder a proteção.
- Variações desbloqueadas por frutas especiais na Ilha 5: Bolota-de-Fogo? **Não**: nossas variações são **Bolota Pedra** (afunda na água e anda no fundo) e **Bolota Seda** (solta fio e balança em ganchos).

### 4.7 Câmera

- Janela morta horizontal de 32 px; olha 48 px à frente na direção do movimento, com suavização exponencial (fator 0,12).
- Vertical: só sobe quando Lumi pousa numa plataforma mais alta (evita tremedeira nos pulos); desce imediatamente se ela cai para fora da janela.
- Fases podem travar eixos (autoscroll, salas de chefe).

### 4.8 Controles

| Ação | Teclado | Controle |
|---|---|---|
| Mover | Setas / WASD | D-pad / analógico |
| Pulo | Z / Espaço | A / Cruz |
| Correr / Pegar / Lanterna | X / Shift | X / Quadrado |
| Cambalhota | C | B / Círculo |
| Pausa | Enter / Esc | Start |

Remapeável. Toque na tela para mobile no marco M9.

---

## 5. Inimigos e chefes

### 5.1 Inimigos comuns (todos originais)

| Nome | Ilha | Comportamento | Como derrotar |
|---|---|---|---|
| **Caranguejo-Ermitão** | 1+ | Anda de lado; ao ser pisado entra na concha, que vira objeto chutável | Pisar, chutar a concha |
| **Gaivota-Ladra** | 1+ | Sobrevoa em seno, mergulha quando Lumi está embaixo | Pisar, orbe |
| **Ouriço-Bomba** | 1+ | Rola lento; tem espinhos | Cambalhota, orbe; atordoado vira bomba carregável |
| **Lesma-Musgo** | 2+ | Anda colada em qualquer superfície, inclusive teto | Pisar (por cima), orbe |
| **Fantoche de Névoa** | 2+ | Se esconde em neblina, aparece quando Lumi vira de costas | Luz da Lanterna o dissolve; pisar |
| **Polvo-Cano** | 3+ | Sai de canos de pedra e cospe tinta em arco | Pisar quando exposto |
| **Pipa-Espinho** | 3+ | Presa a um fio, faz órbita | Só desviar; Cambalhota quica |
| **Água-Viva-Lâmpada** | 4 | Flutua na água, pulsa luz e dano em ciclo | Atacar na fase apagada |
| **Toupeira-Mineira** | 5 | Cava, aparece embaixo de Lumi | Pisar ao sair |
| **Morcego-Fole** | 6 | Infla e explode em vento | Orbe antes de inflar |
| **Marujo de Bruma** | 7 | Soldado de neblina com remo; bloqueia ataques frontais | Pisar, Cambalhota |

### 5.2 Chefes

Um mini-chefe no forte da metade de cada ilha e um chefe no farol. Cada chefe ensina ou testa a mecânica da ilha.

1. **Rei Siri** (Ilha 1): caranguejo gigante; pisar na garra quando ela crava no chão.
2. **Mãe-Musgo** (Ilha 2): lesma enorme no teto; usar Bolota rolando nas paredes.
3. **Barão Cata-Vento** (Ilha 3): moinho vivo; usar as correntes de vento para alcançar o eixo.
4. **Medusa-Maré** (Ilha 4): arena que enche e esvazia de água.
5. **Velha Broca** (Ilha 5): toupeira com máquina; derrubar estalactites com Cambalhota.
6. **Sombra de Lumi** (Ilha 6): cópia escura que repete os movimentos com 1 s de atraso.
7. **Capitão Brumo** (Ilha 7): três fases (navio-fantasma, cordame no alto, topo do farol mestre).

---

## 6. Estrutura do mundo e das fases

### 6.1 As sete ilhas

| # | Ilha | Tema | Mecânica nova | Fases | Saídas secretas |
|---|---|---|---|---|---|
| 1 | **Praia do Sino** | Praia, dunas, coqueiros | Básico, Ímpeto, Concha | 5 + forte + farol | 1 |
| 2 | **Bosque Encharcado** | Mangue, cogumelos, chuva | Bolota, lesmas no teto | 6 + forte + farol | 2 |
| 3 | **Penhasco dos Ventos** | Falésias, moinhos, pipas | Correntes de vento, Folha de Vento | 6 + forte + farol | 1 |
| 4 | **Recife Profundo** | Recife de coral, cavernas submersas | Água, maré que sobe e desce | 6 + forte + farol | 2 |
| 5 | **Minas de Sal** | Cavernas brancas, vagonetes | Trilhos, Bolota Pedra/Seda | 6 + forte + farol | 2 |
| 6 | **Vale Sem Lua** | Floresta escura, vaga-lumes | Escuridão, Lanterna Viva | 5 + forte + farol | 1 |
| 7 | **Farol Mestre** | Navio-fantasma, torre | Tudo junto | 4 + chefe final | — |
| ★ | **Rota das Constelações** | Fases-desafio no céu | Domínio total | 8 | Desbloqueada por saídas secretas |

**Total:** ~46 fases normais + 7 fortes + 7 faróis + 8 desafio ≈ **68 fases**. A v1.0 jogável é a Ilha 1 completa (M6); o resto vem em ondas (M7–M8).

### 6.2 Mapa-múndi

- Vista de cima, Lumi anda entre nós em caminhos que se revelam com animação de "pegadas na areia".
- Fase concluída: bandeira azul. Saída secreta: bandeira dourada e um caminho novo.
- **Pontes de Corda** entre ilhas abrem atalhos (como portais), desbloqueadas encontrando saídas secretas.
- Casas de bônus no mapa: **Tenda da Ondina** (escolhe 1 de 3 itens guardados) e **Cassino de Conchas** (minijogo de memória).
- Itens guardados: até 1 item na reserva, usado com um botão durante a fase (cai do alto da tela).

### 6.3 Anatomia de uma fase (template)

1. **Introdução segura** (0–15%): mostra a ideia da fase sem risco.
2. **Desenvolvimento** (15–45%): combina a ideia com algo conhecido.
3. **Sino de checkpoint** (~50%).
4. **Torção** (50–85%): a ideia de um jeito surpreendente.
5. **Clímax e saída** (85–100%): portal de fim de fase = **arco de corda com bandeirola**; quanto mais alto Lumi toca, mais âmbar ganha.
6. **Segredos:** 3 Pérolas (uma fácil, uma de exploração, uma de execução) e, quando houver, uma chave que abre a saída secreta.

Tamanho alvo: 180–320 tiles de largura, 12–30 de altura. Tempo médio de 2–4 min numa primeira passada.

---

## 7. Arquitetura técnica

### 7.1 Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Linguagem | **TypeScript** (strict) | Tipagem forte, roda no navegador, ótimo ferramental |
| Build | **Vite** | Dev server instantâneo, build estático para GitHub Pages |
| Render | **Canvas 2D** num buffer 320×180, escalado por inteiro com `image-rendering: pixelated` | Simples, nítido, suficiente para 16 bits; WebGL fica como otimização opcional |
| Áudio | **Web Audio API** com sintetizador próprio | Música e SFX gerados por código, sem arquivos de áudio |
| Testes | **Vitest** (unidade) + **Playwright** (headless, screenshots e replays) | Roda em CI e aqui no ambiente |
| Lint/format | ESLint + Prettier | Consistência |
| Empacotamento nativo | **Tauri** (M10, opcional) | App de macOS leve a partir do mesmo build |
| Dependências de runtime | **Zero** | Motor 100% nosso |

### 7.2 Estrutura de pastas

```
smw/
├─ CLAUDE.md                 regras do projeto para mim
├─ README.md
├─ docs/
│  ├─ PLANO.md               este documento
│  ├─ fisica.md              números finais de física após tuning (M2)
│  └─ diario.md              log de decisões por marco
├─ src/
│  ├─ main.ts                boot, cria o Game
│  ├─ engine/
│  │  ├─ loop.ts             timestep fixo 60 Hz + acumulador, render interpolado
│  │  ├─ fixed.ts            matemática de ponto fixo (1/256 px)
│  │  ├─ input.ts            teclado + Gamepad API, buffer por frame, remapeamento
│  │  ├─ renderer.ts         buffer 320×180, sprites, tilemaps, parallax, paletas
│  │  ├─ camera.ts
│  │  ├─ audio/              synth.ts (osciladores, envelopes), sequencer.ts, sfx.ts
│  │  ├─ rng.ts              PRNG determinístico (seed por fase)
│  │  └─ save.ts             localStorage com versão e migração
│  ├─ game/
│  │  ├─ scenes/             Title, WorldMap, Level, Pause, Cutscene, Credits
│  │  ├─ entities/           player.ts, bolota.ts, enemies/*.ts, items/*.ts
│  │  ├─ physics/            tilecollision.ts (AABB + rampas), bodies.ts
│  │  ├─ level/              loader.ts, tiles.ts (tipos de tile), triggers.ts
│  │  └─ hud.ts
│  ├─ content/
│  │  ├─ art/                sprites e tiles como texto (ver §8.1)
│  │  ├─ music/              músicas como dados de sequenciador
│  │  ├─ levels/             fases em JSON
│  │  └─ world.json          grafo do mapa-múndi
│  └─ tools/
│     └─ editor/             editor de fases (rota /editor no dev server)
├─ tests/
│  ├─ unit/                  física, colisão, ponto fixo, save
│  ├─ replays/               inputs gravados + hash do estado final
│  └─ e2e/                   Playwright: boot, screenshots-referência
└─ .github/workflows/        ci.yml (lint + testes), pages.yml (deploy)
```

### 7.3 Núcleo do motor

- **Loop:** `update()` sempre a 60 Hz fixos (acumulador), `render(alpha)` na taxa do monitor (120 Hz no MacBook com ProMotion fica liso). Spiral-of-death limitado a 5 updates por frame.
- **Determinismo:** física em inteiros, PRNG com seed, nenhuma dependência de `Date`/`Math.random` no gameplay. Permite **replays** gravando só os inputs, usados nos testes.
- **Entidades:** classes simples com `update()`/`draw()` e componentes leves (corpo físico, sprite animado, hitbox/hurtbox). Sem ECS genérico: o jogo tem poucas centenas de entidades por fase, objetos diretos são mais legíveis.
- **Ativação por câmera:** entidades nascem quando sua coluna entra a 2 tiles da borda da tela e congelam/somem fora de um raio; inimigos derrotados não voltam até sair e reentrar na fase.
- **Colisão com tiles:** separação por eixo (X depois Y), sensores nos pés para rampas, tipos de tile: sólido, plataforma, rampa (4 variações × 2 direções), dano, água, escada, vento, gatilho.
- **Colisão entre entidades:** grade espacial de 64 px, testes AABB, regra de "pisar" = Lumi descendo e base dela acima do centro do inimigo no frame anterior.
- **Cenas:** pilha de cenas (Pausa empilha sobre Level), transições com íris e fade.
- **Save:** 3 slots, guarda fases concluídas, saídas, pérolas, âmbar, item reservado, tempo de jogo. Versionado.

### 7.4 Renderização

- Camadas por fase: céu (gradiente), 2 a 3 camadas de parallax, tiles de fundo, entidades, tiles de frente, partículas, HUD.
- Paletas indexadas por ilha; **troca de paleta** para variações (noite, neblina, inimigo atordoado, dano piscando).
- Animações por tabela de frames com duração por frame.
- Partículas: poeira de freada, splash, faíscas de Ímpeto, folhas, chuva, vaga-lumes.

### 7.5 Áudio

- Sintetizador com 8 vozes: onda quadrada (duty variável), triângulo, dente de serra, ruído, e um "pluck" por síntese Karplus-Strong. Envelopes ADSR, vibrato, eco simples.
- **Sequenciador** lê padrões de notas em texto (formato tracker simplificado) com loop e intro.
- Música adaptativa leve: ao montar Bolota entra uma camada de percussão extra; sob a água tudo passa por filtro passa-baixa.
- ~20 faixas originais: tema principal, mapa, uma por ilha + variante de caverna/água, forte, chefe, chefe final, vitória, game over, créditos.
- ~40 SFX gerados por parâmetros (pulo, quique, moeda, freada, quebra de bloco, power-up, dano, etc.).

---

## 8. Pipeline de conteúdo

### 8.1 Pixel art em código

Sprites e tiles são escritos como **mapas de caracteres** com uma paleta por arquivo, por exemplo:

```ts
export const LUMI_IDLE = sprite({
  palette: { '.': null, k: '#1b1b2f', y: '#f4c430', b: '#24345c', s: '#f2c6a0', r: '#c0392b', w: '#fff' },
  frames: [`
......bbbb......
.....bbbbbb...w.
....bbbbbbbb.ww.
....kssssssk....
....sskssks.....
     ...        `],
});
```

- Um script de build converte tudo em **atlas** de textura na inicialização (cache em memória), então nada de PNG no repositório.
- Ferramenta de pré-visualização (`npm run art`) gera uma página com todos os sprites animados, para eu revisar visualmente por screenshot headless e você revisar no navegador.
- Guia de estilo: contorno escuro de 1 px nos personagens, cenário sem contorno, luz vindo de cima-esquerda, 3 tons por material, no máximo 16 cores por paleta de ilha.

### 8.2 Fases

- Formato **JSON** por fase: camadas de tiles (strings por linha para ficar legível no diff), lista de entidades com propriedades, gatilhos, metadados (música, paleta, tempo, posição dos checkpoints).
- **Editor de fases** no navegador (`/editor`): pintar tiles, posicionar entidades, testar na hora com Lumi a partir do cursor, salvar/baixar JSON. Ferramenta interna, mas boa o bastante para você criar fases também.
- **Validador** roda em CI: fase alcançável do início ao fim (busca de caminho com a física de pulo simplificada), todas as Pérolas existem, nada fora dos limites.

### 8.3 Música

- Escrita em formato texto tipo tracker (`C4 . E4 . G4 --- `) por canal.
- Cada faixa começa por um esboço de 8 compassos, aprovado antes de virar a faixa completa.

---

## 9. Qualidade, testes e CI

| Tipo | O que cobre | Quando |
|---|---|---|
| Unitário (Vitest) | Ponto fixo, colisão com rampas, medidor de Ímpeto, variáveis do pulo, save/migração | A cada commit |
| Replay determinístico | Inputs gravados de trechos de fase → hash do estado final igual ao esperado | A cada commit; quebra = mudança de física detectada |
| E2E (Playwright) | Jogo sobe, título → mapa → fase → fim de fase; screenshots de referência por fase | A cada PR |
| Validador de fases | Alcançabilidade, colecionáveis, limites | A cada commit que toca `content/levels` |
| Performance | 60 fps estáveis em fase cheia (medido em headless com throttling de CPU 4×) | Marcos M5+ |
| Playtest humano | Você joga a build do GitHub Pages e comenta | Fim de cada marco |

CI no GitHub Actions: `lint → typecheck → unit → replays → build → e2e`. Deploy automático do `main` para GitHub Pages.

**Definição de pronto para cada tarefa:** código tipado sem `any`, testes passando, sem regressão nos replays, screenshot conferido por mim, entrada no `docs/diario.md`.

---

## 10. Roadmap por marcos

Cada marco termina com uma build jogável publicada e uma nota no diário. As estimativas são de sessões de trabalho comigo.

### M0 — Fundação (1 sessão)
- [x] Vite + TypeScript strict + ESLint/Prettier + Vitest + Playwright
- [x] Loop de timestep fixo, buffer 320×180 escalado por inteiro, tela cheia
- [x] Input de teclado e controle com buffer por frame
- [x] CI e deploy no GitHub Pages
- **Pronto quando:** um quadrado se move na tela com controle, a 60 Hz fixos, publicado no Pages.

### M1 — Lumi se move (1–2 sessões)
- [x] Ponto fixo, corpo físico, colisão com tiles sólidos e plataformas
- [x] Andar, correr, Ímpeto, freada, pulo variável, coyote, buffer
- [x] Câmera com janela morta e lookahead
- [x] Fase de teste em JSON + loader
- [x] Primeiro sprite de Lumi (parado, andando, correndo, pulando, caindo, freando)
- **Pronto quando:** dá para correr e pular numa fase de teste e a sensação já é boa.

### M2 — Tuning de sensação (1 sessão + seu playtest)
- [x] Painel de depuração (`F1`) para ajustar constantes ao vivo
- [x] Rampas, deslizar, Cambalhota, quique
- [x] Água básica
- [x] Gravar os números finais em `docs/fisica.md` + replays de referência
- **Pronto quando:** você joga e aprova o feeling.

### M3 — Mundo vivo (2 sessões)
- [x] Sistema de entidades, ativação por câmera, grade espacial
- [x] Caranguejo-Ermitão, Gaivota-Ladra, Ouriço-Bomba
- [x] Carregar/chutar/arremessar
- [x] Blocos-baú, blocos rachados, âmbar, Concha-Escudo, dano e invencibilidade
- [x] HUD (vidas, âmbar, pérolas, medidor de Ímpeto, item reservado)
- **Pronto quando:** uma fase curta tem inimigos, itens e dá para morrer e ganhar.

### M4 — Arte e som de verdade (2 sessões)
- [x] Sistema de sprite-em-texto + atlas + página de pré-visualização
- [x] Tileset completo da Praia do Sino, parallax de 3 camadas, partículas
- [x] Sintetizador, sequenciador, 15 SFX essenciais
- [x] Tema da Ilha 1 e tema principal
- **Pronto quando:** uma fase parece e soa como um jogo, não um protótipo.

### M5 — Ferramentas (1–2 sessões)
- [x] Editor de fases no navegador com teste instantâneo
- [x] Validador de fases no CI
- [x] Gravação/reprodução de replays
- **Pronto quando:** criar uma fase nova leva minutos, não horas.

### M6 — Ilha 1 completa: *vertical slice* (2–3 sessões)
- [x] Título, seleção de save, mapa-múndi da Ilha 1, transições
- [x] 5 fases + forte (mini-chefe) + farol (Rei Siri)
- [x] Sino de checkpoint, arco de fim de fase, Pérolas, saída secreta, game over
- [x] Save em 3 slots, pausa, opções (volume, remapeamento)
- [x] Cena de abertura e cena do primeiro farol aceso
- **Pronto quando:** dá para jogar a Ilha 1 do começo ao fim sem bugs conhecidos. **Esta é a primeira versão "de verdade" (v0.1).**

### M7 — Ilhas 2 e 3 (4–5 sessões)
- [x] Bolota (montar, pulo duplo, rolar, fuga ao levar dano)
- [x] Folha de Vento (planar, rajada, voo em Ímpeto), correntes de vento
- [x] Lesma-Musgo, Fantoche de Névoa, Polvo-Cano, Pipa-Espinho
- [x] 12 fases + 2 fortes + 2 faróis, músicas das ilhas
- **Pronto quando:** v0.2 jogável até o terceiro farol.

### M8 — Ilhas 4 a 7 e final (8–10 sessões)
- [x] Água completa e maré, trilhos, Bolota Pedra/Seda, escuridão e Lanterna Viva
- [x] Inimigos restantes, chefes 4–7 com Capitão Brumo em três fases
- [x] Rota das Constelações (8 fases-desafio)
- [x] Cena final e créditos
- **Pronto quando:** v0.9, jogo completo zerável.

### M9 — Polimento (2–3 sessões)
- [x] Passada de dificuldade com base no seu playtest
- [x] Controles de toque para mobile, acessibilidade (modo assistido: mais vida, câmera lenta opcional, contraste alto)
- [x] Extras desbloqueáveis pelas Pérolas: galeria de arte, sala de som, modo contra-relógio
- [x] Otimização e testes de performance
- **Pronto quando:** v1.0.

### M10 — App nativo para Mac (opcional, 1 sessão)
- [x] Empacotar com Tauri, ícone, tela cheia nativa, saves em arquivo
- [x] `.dmg` gerado no CI
- **Pronto quando:** você abre o jogo pelo Launchpad.

**Caminho até algo bom de jogar:** M0 → M6 em ~10 a 13 sessões.

---

## 11. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| A sensação do pulo não ficar boa | Alto: é o coração do jogo | M2 inteiro dedicado a isso, painel de ajuste ao vivo, seu playtest como critério de aceite |
| Arte em código ficar simplória | Médio | Guia de estilo, página de pré-visualização, revisão visual por screenshot a cada sprite; se precisar, aceitar PNGs desenhados por você como alternativa |
| Escopo de 68 fases ser grande demais | Alto | Ilha 1 é uma v0.1 completa por si só; cada ilha seguinte é um incremento independente |
| Bugs de colisão em rampas | Médio | Testes unitários específicos e replays desde o M1 |
| Ficar parecido demais com um jogo existente | Alto (legal e criativo) | Regras do §1, checagem em cada asset, nomes e visuais revisados no diário |
| Performance no navegador | Baixo | Canvas 320×180 é leve; medir desde o M5 |
| Áudio bloqueado até interação do usuário | Baixo | Tela de título exige um toque/tecla, que destrava o `AudioContext` |

---

## 12. Como eu vou trabalhar neste repositório

- **Branch por marco** (`m0-fundacao`, `m1-movimento`…), PR para `main` com resumo, screenshots e o que testar. `main` sempre jogável.
- **Commits pequenos** e descritivos em português.
- **Diário** (`docs/diario.md`): decisões, números ajustados e o que mudou, para qualquer sessão futura retomar de onde paramos.
- **Verificação antes de entregar:** rodo os testes, abro o jogo no Chromium headless, jogo trechos por replay e confiro screenshots antes de dizer que algo está pronto.
- **Seu papel:** jogar a build publicada no fim de cada marco e dizer o que sentiu. Fora isso, eu decido e registro.

Próximo passo: playtest humano. A física e a dificuldade estão ajustadas por simulação e por bot; a palavra final sobre a sensação do pulo é de quem joga.
