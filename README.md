# Super Tux Hello World

Recriação de um jogo no estilo **Super Mario World**, estrelado por **Tux**, o pinguim do Linux, com temática 100% Linux e layout moderno. Feito **apenas com HTML, CSS e JavaScript** — sem bibliotecas e sem assets externos (tudo é desenhado em tempo real via Canvas 2D).

![Tech](https://img.shields.io/badge/html-css-js-green) ![Status](https://img.shields.io/badge/status-100%25%20pronto-brightgreen)

## Como rodar

Basta abrir o `index.html` em qualquer navegador moderno (duplo clique, ou drag & drop na aba). Funciona offline.

```bash
# opcional: servir localmente
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Objetivo

Cole **pacotes APT**, pegue o power-up **sudo**, esmague bugs e vírus e chegue à **flag de boot** do fim de cada fase. Zere as 3 fases para ver a tela de vitória **Hello, World!**.

## Controles

| Ação | Teclado |
|------|---------|
| Mover | `←` `→` ou `A` `D` |
| Pular | `Espaço`, `↑` ou `W` |
| Queda rápida | `↓` ou `S` (no ar) |
| Pausar | `P` ou `Esc` |
| Som | `M` |
| Iniciar / Reiniciar | `Enter` |

> Em celulares/tablets, controles de toque aparecem automaticamente.

## Temática Linux

| Elemento | Tema |
|----------|------|
| Protagonista | Tux, o pinguim |
| Moeda | Pacote **APT** |
| Power-up | **sudo** (deixa o Tux grande) |
| Inimigo do chão | **Bug** de software |
| Inimigo voador | **Vírus** |
| Bloco de item | Bloco `?` |
| Bloco quebradiço | Brick de terminal |
| Fim de fase | Flag de **boot** |
| Game over | **KERNEL PANIC** |
| Vitória | **Hello, World!** |

## Gameplay

- Física com aceleração, atrito, gravidade e velocidade máxima
- Polimento: *coyote time*, *jump buffer* e *variable jump*
- Tux pequeno: 1 toque em inimigo/espinho = perde uma vida
- Tux grande (com sudo): aguenta 1 toque e quebra bricks
- Esmagar inimigo pulando dá pontos e quique
- Pacotes valem +100; a cada 100 pacotes ganha 1 vida
- Blocos `?` dão pacote ou **sudo** ao serem acertados por baixo
- Bônus de tempo ao completar a fase

## Fases

1. **`boot.sh`** — introdução: blocos, canos e o primeiro buraco
2. **`kernel.ko`** — buracos maiores, espinhos e mais vírus
3. **`desktop`** — desafio final com corredor de espinhos

## Estrutura

```
SuperTuxHelloWorld/
├── planning.md   # planejamento do projeto
├── README.md     # este arquivo
├── index.html    # estrutura, HUD e telas
├── style.css     # layout moderno (dark/neon/glass)
└── game.js       # loop, física, colisão, sprites e sons
```

## Tecnologias e recursos

- **Canvas 2D** — todo o desenho (Tux, inimigos, tiles, fundo, partículas)
- **Web Audio API** — efeitos sonoros gerados proceduralmente
- **HTML/CSS modernos** — dark mode, neon verde terminal, glassmorphism, HUD overlay
- **Responsivo** — escala o canvas e mostra controles de toque

## Feito com `</>` para o Linux
