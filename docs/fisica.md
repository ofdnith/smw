# Física da Lumi — números finais (v1.0)

Unidades: pixels por frame a 60 Hz. Tile = 16 px. Hitbox de Lumi: 10×20 px (10×28 montada). Os valores vivem em `PHYS` (`src/game/entities/player.ts`) e podem ser ajustados ao vivo com F1 (painel) + F2..F7.

| Parâmetro | Valor | Resultado |
|---|---|---|
| Andar | 1,50 px/f | 5,6 tiles/s |
| Correr | 2,60 px/f | 9,75 tiles/s |
| Ímpeto (medidor cheio) | 3,40 px/f | 12,75 tiles/s |
| Aceleração andar / correr | 0,055 / 0,075 | ~27 / ~35 frames até o máximo |
| Desaceleração | 0,060 | para em ~25 frames da corrida |
| Freada (direção oposta) | 0,160 | com poeira e som |
| Controle no ar | 75% | |
| Pulo | −5,20 + 0,30·|vx| | parado ≈ 3,1 tiles; correndo ≈ 4,3; em ímpeto ≈ 4,6 |
| Cambalhota | −4,30 | ≈ 2,3 tiles; quebra blocos rachados ao cair |
| Gravidade segurando / soltando | 0,26 / 0,62 | toque curto ≈ 1,2 tile |
| Queda máxima | 4,50 | planando: 0,90 |
| Coyote time / buffer de pulo | 6 / 7 frames | |
| Quique em inimigo | −3,8 (−5,4 segurando) | |
| Mola | −7,2 | ≈ 6 tiles |
| Natação | braçada −2,1, gravidade 0,09, máx. horizontal 1,45 | |
| Medidor de ímpeto | enche 1 segmento a cada 8 frames correndo; esvazia 2× mais rápido | 7 segmentos |
| Voo baixo (Folha + ímpeto) | 120 frames | sobe segurando pulo |

## Regras de design derivadas
- Degraus de até **3 tiles** são sempre alcançáveis; **4 tiles** exigem corrida.
- Buracos de até **6 tiles** correndo; 7 com ímpeto.
- Nunca deixar um fosso sem saída (o validador `tests/unit/reach.test.ts` reprova fins e pérolas inalcançáveis).
- Blocos-baú a 4 tiles acima do chão (linha H−8 com chão de 3) são batidos com pulo parado.

## Determinismo
Toda a lógica usa apenas `+ − × ÷`, `Math.floor/round` e seno por tabela (`tsin`), com PRNG próprio (`Rng`). O resultado é idêntico em qualquer navegador, o que permite os testes de simulação (`tests/unit/*.test.ts`) e o bot (`tools/bot.mjs`).

## Colisões (v1.2)

| Regra | Valor | Por quê |
|---|---|---|
| Correção de quina | até 4 px | a cabeça que raspa a quina de um bloco desliza para o lado e o pulo continua, em vez de parar seco |
| Ajuda na borda | até 5 px | caindo rente a um degrau, os pés sobem nele em vez de escorregar pela parede (só no ar; andando no chão não escala) |
| Área de dano da Lumi | corpo menos 2 px de cada lado e 4 px no topo | encostar de raspão num inimigo não machuca; o pisão continua usando o corpo inteiro |
| Caixa do inimigo para dano | encolhida até 2 px nas laterais e no topo | idem |
| Espinhos | só a parte de baixo do tile (onde há pontas) | encostar ao lado, acima das pontas, não machuca |
| Névoa/lava | abaixo da crista (3 px) | idem |
| Parede à direita | margem mínima em vez de 1 px | antes o corpo entrava até 1 px nas paredes à direita (à esquerda era exato) |

Os valores vivem em `src/game/physics/tilecollision.ts` (`CORNER_SLIDE`, `LEDGE_ASSIST`) e em `src/game/entities/player.ts` (`HURT_INSET_X`, `HURT_INSET_TOP`). Testes em `tests/unit/collisions.test.ts`.
