# Super Tux Hello World — Planejamento

Recriação de um jogo no estilo **Super Mario World**, estrelado pelo pinguim do Linux (**Tux**), com temática 100% Linux e layout moderno. Feito apenas com **HTML, CSS e JavaScript** (sem bibliotecas, sem assets externos — tudo desenhado via Canvas).

## 1. Visão Geral

- **Nome:** Super Tux Hello World
- **Gênero:** Plataforma 2D (side-scroller)
- **Estilo visual:** Dark mode + neon verde terminal, glassmorphism, cantos arredondados
- **Plataforma:** Navegador (abrir `index.html`)
- **Persistência:** Nenhuma — 100% local, offline

## 2. Temática Linux

| Elemento do jogo | Tema Linux |
|------------------|------------|
| Protagonista | Tux, o pinguim mascote do Linux |
| Moeda | Pacotes **APT** (`apt-get install`) |
| Power-up | **Sudo** (super user) — deixa o Tux grande |
| Inimigo comum | **Bug** (bug de software) |
| Inimigo voador | **Vírus** (malware) |
| Bloco de item | Bloco **?** (dá pacote ou sudo) |
| Bloco quebradiço | **Brick** de terminal |
| Fim de fase | **Flag de boot** — "Boot Completo" |
| Tela de morte | **KERNEL PANIC** |
| Vitória | **Hello, World!** |
| Fundo | Céu terminal com `$`, `#`, `{}` e janelas de terminal (nuvens) |
| HUD | `PONTOS`, `APTs`, `VIDAS`, `TEMPO` |

## 3. Tech Stack

- `index.html` — estrutura, HUD (HTML overlay) e telas
- `style.css` — layout moderno, dark theme, glass, neon, animações
- `game.js` — loop do jogo, física, colisão, desenho via Canvas 2D
- Som via **Web Audio API** (beeps gerados proceduralmente)

## 4. Layout Moderno

- Página centrada com moldura de vidro fosco (`backdrop-filter`)
- Barra superior com logo e botão de som
- **HUD** como overlay em HTML (pills com SVGs) sobre o canvas
- Canvas interno `960×540` (16:9) com escala responsiva
- Controles na tela para touch (aparecem só em dispositivos táteis)
- Fonte monoespaçada (JetBrains Mono / fallback) para vibe terminal

## 5. Controles

| Ação | Teclado |
|------|---------|
| Mover | `←`/`→` ou `A`/`D` |
| Pular | `Espaço`, `↑` ou `W` |
| Queda rápida | `↓` ou `S` (no ar) |
| Pausar | `P` ou `Esc` |
| Som | `M` |
| Iniciar | `Enter` (no menu) |

Detalhes de polimento: *coyote time* (pulo após sair da borda), *jump buffer* (pulo que não "engasga"), *variable jump* (pulo mais baixo soltando a tecla).

## 6. Gameplay

- **Física:** aceleração, atrito, gravidade, velocidade máxima
- **Morte ao cair em buracos**, tocar espinhos ou ser atingido por inimigo
- **Tux pequeno** → 1 hit = morte; **Tux com sudo** → 1 hit = volta a ser pequeno
- Tux grande **quebra bricks** e **esmaga inimigos por contato**
- **Pisar em inimigo** = esmagá-lo e ganhar pontos (com partículas e bounce)
- **Blocos `?`** ao serem acertados por baixo dão pacote/coin ou **sudo**
- **Pacotes:** +100 pontos; a cada 100 pacotes → +1 vida
- **Flag:** conclui a fase com bônus de tempo
- **Tempo:** 300s por fase

## 7. Personagens & Sprites (desenhados por código)

- **Tux:** corpo preto, barriga branca, bico e pés laranja, nadadeiras animadas
- **Bug:** corpo vermelho com manchas, antenas e patinhas (esmaga na morte)
- **Vírus:** blob verde com espinhos e olhos de mal
- **Pacote (APT):** quadrado dourado 3D com ícone de seta para cima
- **Sudo:** escudo ciano com `$`
- **Flag:** mastro com bandeira verde terminal `</>`

## 8. Fases (3 níveis)

1. **`boot.sh`** — introdução, blocos, canos, primeiro buraco, 1 vírus
2. **`kernel.ko`** — buracos maiores, espinhos, mais vírus
3. **`desktop`** — desafio final com corredor de espinhos → vitória

## 9. Sons (Web Audio)

- Pulo, moeda, esmagar bug, power-up, dano, morte, fim de fase, brick quebrado, game over.

## 10. Telas

- **Menu:** título animado com cursor de terminal `$`, botão START
- **Pausa:** overlay
- **Boot completo:** banner com bônus
- **Kernel Panic (game over):** botão reiniciar
- **Hello, World! (vitória):** estatísticas e replay

## 11. Estrutura de Arquivos

```
SuperTuxHelloWorld/
├── planning.md
├── index.html
├── style.css
└── game.js
```

## 12. Roadmap

- [x] Planejamento
- [x] Estrutura HTML + HUD
- [x] Layout moderno (CSS)
- [x] Loop do jogo, física e colisão por tiles
- [x] Tux desenhado em Canvas
- [x] Inimigos (bug, vírus)
- [x] Pacotes, sudo, bricks, blocos `?`
- [x] 3 fases + flag
- [x] Sons, partículas, screen shake, floaters
- [x] Telas: menu, pausa, game over, vitória
- [x] Controles de toque
