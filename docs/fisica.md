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
