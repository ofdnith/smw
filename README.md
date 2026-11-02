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

Em celulares, os controles de toque aparecem automaticamente (também podem ser ligados na pausa).

## O jogo
- **7 ilhas + Rota das Constelações**: Praia do Sino, Bosque Encharcado, Penhasco dos Ventos, Recife Profundo, Minas de Sal, Vale Sem Lua, Farol Mestre — 39 fases, 7 chefes, 2 fases secretas e 4 desafios.
- **Poderes**: Concha-Escudo, Folha de Vento (planar, rajada e voo com ímpeto), Lanterna Viva (orbes de luz revelam blocos invisíveis).
- **Bolota**, o besouro montaria: pulo duplo, rolagem que quebra blocos, variantes Pedra e Seda.
- **Pérolas da Maré**: 3 por fase, escondidas. **Saídas secretas** abrem caminhos novos no mapa e a Rota das Constelações.
- Trilha sonora com 16 temas e ~45 efeitos gerados por um sintetizador próprio (Web Audio).
- Save em 3 arquivos, modo assistido, controles de toque e gamepad.

## Desenvolvimento
```
npm install
npm run dev        # http://localhost:5173
npm run check      # lint + typecheck + testes unitários (física, mecânicas, chefes, alcançabilidade das 39 fases, música)
npm run e2e        # fluxo completo no Chromium headless
npm run build      # dist/ (publicado automaticamente no GitHub Pages)
```
Ferramentas: `node tools/bot.mjs 1-1` (bot joga uma fase), `node tools/sheet.mjs 2-1 out.png` (folha de contato), `node tools/shot.mjs "level=3-2" 60 out.png` (captura).

Atalhos de URL para testar: `?level=4-2` abre uma fase; `?map&cleared=1-1,1-2` abre o mapa com fases concluídas.

## Documentos
- [`docs/PLANO.md`](docs/PLANO.md) — plano de design e arquitetura
- [`docs/fisica.md`](docs/fisica.md) — números finais da física e regras de design
- [`docs/diario.md`](docs/diario.md) — diário de desenvolvimento

## Stack
TypeScript · Vite · Canvas 2D (320×180) · Web Audio · Vitest · Playwright · zero dependências de runtime.
