# Lumi 2.0 — Plano de fidelidade 16 bits

> **Estado (2026-11-02, v1.3):** F0, F1 e F2 feitas. Próximo marco: **F3, a Ilha 1 em 16 bits** (v1.5), que depende do seu playtest para fechar.
> Documento de planejamento completo, com diagnóstico e riscos: https://claude.ai/artifact/YWvoEyMUpFSzTiNPtWTkWx

## Objetivo

A v2.0 passa no **teste dos 10 segundos**: quem vê 10 s de vídeo de qualquer ilha acredita que é um cartucho de Super Nintendo de 1993–95 que nunca conheceu. O caminho é imitar o **hardware e o padrão de acabamento** do console, não um jogo específico: o motor obedece aos limites reais (quadro, cores, camadas, vozes) e essa restrição dá a cara de 16 bits. As regras de originalidade do `PLANO.md` continuam valendo; jogos da época servem só como régua de qualidade.

## Console virtual (regras do motor)

| Recurso | Regra | Onde |
| --- | --- | --- |
| Quadro | 256×224, escala inteira | `src/engine/renderer.ts` |
| Cor | RGB555 (32 níveis por canal) em todo pixel | `src/engine/console.ts` |
| Sprites | até 15 cores + transparente por sub-paleta; `fitPalette` encaixa os que passam | `src/engine/sprites.ts` |
| HDMA | degradê de céu linha a linha; deslocamento por linha (ondas na água) | `Renderer.hdma`, `Renderer.waveLines` |
| Mosaico | blocos de 1 a 15 px; usado nos fades | `Renderer.mosaic` |
| Brilho mestre | 16 degraus | `Renderer.brightness` |
| Som | 8 vozes de samples; efeitos usam as vozes 7 e 8; eco com realimentação filtrada | `src/engine/audio/` |
| Samples | 32 kHz, codec ADPCM de 4 bits nosso (bloco de 16 samples em 9 bytes), suavização de interpolação | `adpcm.ts`, `instruments.ts` |

Ainda não implementado no console: camadas BG1/BG2/BG3 explícitas, janelas (recortes por linha), transparência entre camadas por soma/subtração, Mode 7, orçamento de VRAM por fase.

## Fases

| Fase | Conteúdo | Portão | Estado |
| --- | --- | --- | --- |
| F0 · Auditoria | capturas antes/depois (`tools/capture.mjs`), fiscal de hardware (`tools/fiscal.ts` + `hardware.test.ts`) | relatório | feita |
| F1 · Console de vídeo | 256×224, RGB555, HDMA, ondas, mosaico, brilho, fonte em negrito, telas reorganizadas | fases atuais a 60 fps na base nova | feita (camadas, janelas e Mode 7 ficam para quando forem usados: F4, F6, F7) |
| F2 · Console de áudio | chip de samples, 30 instrumentos, eco, orquestração por ilha, mixagem a −20 dB | tema principal aprovado de ouvido | feita, **aguardando sua audição** |
| F3 · Ilha 1 em 16 bits | Lumi com ~60 quadros em pixel art de autoria, tileset e fundos da Praia, 6 fases refeitas à mão, forte com mini-chefe, Rei Siri, física com seu playtest | v1.5 e teste dos 10 segundos | próxima |
| F4 · Ilhas 2 e 3 | tilesets, chuva e vento, Barão Cata-Vento em Mode 7 | playtest | — |
| F5 · Ilhas 4 e 5 | recife e minas, dois mini-chefes | playtest | — |
| F6 · Ilhas 6, 7 e Rota | escuridão por janela, neblina transparente, Capitão Brumo | jogo zerável (v1.9) | — |
| F7 · Apresentação | mapa do arquipélago em Mode 7, título com demonstração, cutscenes pintadas | fluxo revisado | — |
| F8 · Polimento | dificuldade, acessibilidade, filtro CRT opcional, app de Mac | v2.0 | — |

## Critérios de aceite da v2.0

- [ ] 3 pessoas que veem 10 s de vídeo de cada ilha dizem que parece um jogo de Super Nintendo.
- [x] O fiscal de hardware passa sem nenhuma violação.
- [x] Toda música usa no máximo 8 vozes e só samples nossos.
- [ ] Você aprovou a sensação do pulo jogando.
- [ ] Toda fase cumpre o checklist de fases (ideia central, momento memorável, sub-área, segredo, decoração densa).
- [ ] 60 fps estáveis no MacBook Air M2 e num celular intermediário.

## O que ficou para a F3 (anotado ao fazer F0–F2)

- 15 sprites foram desenhados com mais de 15 cores (chefes, Dona Ondina, farol, arco de chegada); o console os encaixa, mas a arte nova deve nascer dentro do limite.
- Os fundos foram compostos para 320×180: no quadro novo, a faixa inferior de vários temas é uma cor lisa. Cada ilha ganha fundos repintados para 256×224.
- As músicas foram reorquestradas (instrumentos, pan, eco, dobra de melodia), mas as partes continuam as da v1.2: contracanto, baixo mais ativo e percussão nova entram ilha por ilha.
- Acentos na fonte e caixas de diálogo com retrato.
