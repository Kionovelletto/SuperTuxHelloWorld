(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 960;
  const H = 540;
  const TILE = 32;
  const ROWS = 15;

  const $ = (id) => document.getElementById(id);
  const hudScore = $('hudScore');
  const hudCoins = $('hudCoins');
  const hudLives = $('hudLives');
  const hudTime = $('hudTime');
  const hudLevel = $('hudLevel');
  const ovMenu = $('ovMenu');
  const ovPause = $('ovPause');
  const ovClear = $('ovClear');
  const ovOver = $('ovOver');
  const ovWin = $('ovWin');
  const clearBonus = $('clearBonus');
  const winScore = $('winScore');
  const winCoins = $('winCoins');
  const winTime = $('winTime');

  const BASE_W = 30;
  const BASE_H = 40;
  const BIG_H = 58;
  const JUMP = 640;
  const MAX = 240;
  const ACCEL = 2400;
  const FRICTION = 1700;
  const G_UP = 1500;
  const G_DOWN = 2350;

  let grid = [];
  let level = null;
  let levelIndex = 0;
  let mode = 'menu';
  let time = 300;
  let score = 0;
  let coins = 0;
  let lives = 3;
  let worldT = 0;
  let camX = 0;
  let shake = 0;
  let muted = false;
  let clearT = 0;
  let deadT = 0;

  let player = null;
  let enemies = [];
  let coinObjs = [];
  let powerups = [];
  let particles = [];
  let floaters = [];
  const bumpMap = {};
  let flagPx = 0;
  let flagPy = 0;
  let clouds = [];
  let hills = [];

  const keys = { left: false, right: false, down: false, jumpHeld: false };
  let jumpQueued = false;
  let paused = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function setGrid(tx, ty, ch) {
    if (tx >= 0 && ty >= 0 && tx < level.cols && ty < ROWS) grid[ty][tx] = ch;
  }
  function tileAt(tx, ty) {
    if (tx < 0 || tx >= level.cols) return 'X';
    if (ty < 0) return ' ';
    if (ty >= ROWS) return 'X';
    return grid[ty][tx];
  }
  function isSolid(ch) {
    return ch === '#' || ch === 'X' || ch === 'B' || ch === '?' || ch === 'x' || ch === '=' || ch === '^';
  }
  function isHazard(ch) { return ch === '^'; }

  function setRow(g, r, c0, c1, ch) { for (let c = c0; c <= c1; c++) g[r][c] = ch; }
  function setCell(g, r, c, ch) { g[r][c] = ch; }
  function ground(g, r, c0, c1) { for (let c = c0; c <= c1; c++) for (let rr = r; rr < ROWS; rr++) g[rr][c] = '#'; }
  function pit(g, c0, c1) { for (let c = c0; c <= c1; c++) for (let rr = 0; rr < ROWS; rr++) g[rr][c] = ' '; }

  function makeGrid(def) {
    const g = [];
    for (let r = 0; r < ROWS; r++) g.push(new Array(def.cols).fill(' '));
    def.paint(g);
    return g;
  }

  const lv1 = {
    name: 'boot.sh',
    cols: 120,
    sudo: [[7, 9], [56, 9]],
    spawn: [3, 12],
    flag: 111,
    paint(g) {
      ground(g, 14, 0, 119);
      setCell(g, 12, 3, 'S');
      setCell(g, 7, 9, '?'); setCell(g, 10, 9, '?'); setCell(g, 13, 9, '?');
      setRow(g, 9, 19, 21, 'B'); setRow(g, 9, 23, 25, 'B');
      setRow(g, 8, 30, 36, 'X'); setRow(g, 7, 30, 36, 'o');
      setCell(g, 13, 42, '='); setCell(g, 12, 42, '=');
      setCell(g, 13, 43, '='); setCell(g, 12, 43, '=');
      pit(g, 48, 51);
      setRow(g, 11, 48, 51, 'o');
      setCell(g, 9, 56, '?'); setCell(g, 9, 55, 'o');
      setRow(g, 11, 61, 66, 'o');
      setCell(g, 13, 33, 'E'); setCell(g, 13, 38, 'E');
      setCell(g, 13, 62, 'E'); setCell(g, 13, 79, 'E');
      setCell(g, 12, 68, 'V');
      setCell(g, 9, 90, '?');
      setCell(g, 13, 95, 'P');
      setCell(g, 13, 100, 'X'); setCell(g, 12, 101, 'X'); setCell(g, 11, 102, 'X'); setCell(g, 10, 103, 'X');
      setCell(g, 13, 104, 'X'); setCell(g, 12, 105, 'X'); setCell(g, 11, 106, 'X');
      setCell(g, 7, 111, 'F');
    }
  };

  const lv2 = {
    name: 'kernel.ko',
    cols: 130,
    sudo: [[10, 9], [66, 9], [96, 9]],
    spawn: [3, 12],
    flag: 121,
    paint(g) {
      ground(g, 14, 0, 129);
      setCell(g, 12, 3, 'S');
      setCell(g, 7, 10, '?'); setCell(g, 9, 10, 'o');
      pit(g, 20, 22);
      setRow(g, 11, 20, 22, 'o');
      setCell(g, 12, 28, '='); setCell(g, 11, 28, '='); setCell(g, 10, 28, '=');
      setCell(g, 12, 29, '='); setCell(g, 11, 29, '='); setCell(g, 10, 29, '=');
      setRow(g, 9, 33, 38, 'B');
      setRow(g, 8, 33, 38, 'o');
      pit(g, 52, 55);
      setCell(g, 11, 50, 'V');
      setCell(g, 13, 42, 'E'); setCell(g, 13, 47, 'E'); setCell(g, 13, 60, 'E');
      setCell(g, 13, 66, '?'); setCell(g, 9, 66, '?');
      setCell(g, 13, 75, 'E'); setCell(g, 12, 78, 'V');
      setCell(g, 13, 84, '^'); setCell(g, 13, 85, '^'); setCell(g, 13, 86, '^');
      pit(g, 88, 91);
      setRow(g, 11, 88, 91, 'o');
      setCell(g, 9, 96, '?'); setCell(g, 13, 100, 'E');
      setCell(g, 13, 105, 'V'); setCell(g, 12, 108, 'V');
      setRow(g, 8, 112, 116, 'X'); setRow(g, 11, 112, 116, 'o');
      setCell(g, 13, 118, 'P');
      setCell(g, 13, 119, 'X'); setCell(g, 12, 120, 'X');
      setCell(g, 7, 121, 'F');
    }
  };

  const lv3 = {
    name: 'desktop',
    cols: 140,
    sudo: [[12, 9], [70, 8], [110, 9]],
    spawn: [3, 12],
    flag: 131,
    paint(g) {
      ground(g, 14, 0, 139);
      setCell(g, 12, 3, 'S');
      setCell(g, 7, 12, '?'); setCell(g, 9, 15, 'o'); setCell(g, 9, 16, 'o');
      pit(g, 24, 27);
      setRow(g, 11, 24, 27, 'o');
      setCell(g, 13, 33, 'E'); setCell(g, 13, 36, 'E'); setCell(g, 12, 40, 'V');
      setRow(g, 8, 45, 51, 'X'); setRow(g, 7, 45, 51, 'o');
      setCell(g, 13, 54, 'E');
      pit(g, 60, 64);
      setRow(g, 9, 60, 64, 'o');
      setCell(g, 8, 70, '?'); setCell(g, 9, 74, 'o');
      setCell(g, 13, 78, '^'); setCell(g, 13, 79, '^'); setCell(g, 13, 80, '^');
      setCell(g, 13, 84, 'E'); setCell(g, 13, 88, 'E');
      setCell(g, 12, 92, 'V'); setCell(g, 11, 96, 'V');
      pit(g, 100, 104);
      setRow(g, 11, 100, 104, 'o');
      setCell(g, 9, 110, '?');
      setRow(g, 9, 113, 117, 'B');
      setCell(g, 13, 121, 'E'); setCell(g, 13, 124, 'E');
      setCell(g, 13, 127, 'P');
      setCell(g, 13, 129, 'X'); setCell(g, 12, 130, 'X');
      setCell(g, 7, 131, 'F');
    }
  };

  const LEVELS = [lv1, lv2, lv3];

  function inSudoList(tx, ty) {
    return (level.sudo || []).some((p) => p[0] === tx && p[1] === ty);
  }

  function spawnEnemy(tx, ty, type) {
    const w = type === 'V' ? 30 : 30;
    const h = type === 'V' ? 30 : 26;
    enemies.push({
      type, x: tx * TILE + (TILE - w) / 2, y: ty * TILE + (TILE - h),
      w, h, vx: type === 'V' ? 46 : (Math.random() < 0.5 ? -60 : 60),
      vy: 0, baseY: 0, phase: Math.random() * 6.28,
      onGround: false, dead: false, deadT: 0
    });
    const e = enemies[enemies.length - 1];
    e.baseY = e.y;
  }

  function loadLevel(i) {
    levelIndex = i;
    level = LEVELS[i];
    grid = makeGrid(level);
    enemies = [];
    coinObjs = [];
    powerups = [];
    particles = [];
    floaters = [];
    for (const k in bumpMap) delete bumpMap[k];
    let spawn = [3, 12];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < level.cols; c++) {
        const ch = grid[r][c];
        if (ch === 'S') { spawn = [c, r]; setGrid(c, r, ' '); }
        else if (ch === 'E') { spawnEnemy(c, r, 'E'); setGrid(c, r, ' '); }
        else if (ch === 'V') { spawnEnemy(c, r, 'V'); setGrid(c, r, ' '); }
        else if (ch === 'o') { coinObjs.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, got: false, phase: Math.random() * 6.28 }); setGrid(c, r, ' '); }
        else if (ch === 'P') { powerups.push({ x: c * TILE + 4, y: r * TILE + 4, w: 24, h: 24, vx: 120, vy: 0, emerging: false, got: false }); setGrid(c, r, ' '); }
        else if (ch === 'F') { flagPx = c * TILE + TILE / 2; flagPy = r * TILE; setGrid(c, r, ' '); }
      }
    }
    player = {
      x: spawn[0] * TILE + (TILE - BASE_W) / 2,
      y: (spawn[1] + 1) * TILE - BASE_H,
      w: BASE_W, h: BASE_H,
      vx: 0, vy: 0,
      onGround: false, coyote: 0, buffer: 0,
      cycle: 0, face: 1, inv: 0, big: false
    };
    time = 300;
    clearT = 0;
    deadT = 0;
    camX = 0;
    buildBackdrop();
    hudLevel.textContent = level.name;
    updateHud();
  }

  function buildBackdrop() {
    clouds = [];
    const span = level.cols * TILE * 0.35 + W * 1.5;
    let x = 40;
    while (x < span) {
      clouds.push({ x, y: 40 + Math.random() * 220, s: 0.7 + Math.random() * 0.9 });
      x += 240 + Math.random() * 260;
    }
    hills = [];
    let hx = 0;
    while (hx < span) {
      hills.push({ x: hx, h: 70 + Math.random() * 120, w: 260 + Math.random() * 260 });
      hx += 180 + Math.random() * 220;
    }
  }

  function addScore(n) {
    score += n;
    if (score > 999999) score = 999999;
  }
  function addFloater(x, y, text, color) {
    floaters.push({ x, y, text, color: color || '#39ff88', t: 0 });
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 160;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.4 + Math.random() * 0.3, color, size: 2 + Math.random() * 3 });
    }
  }

  function beep(freq, dur, type, vol, slide) {
    if (muted) return;
    try {
      const actx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, actx.currentTime);
      g.gain.setValueAtTime(vol == null ? 0.08 : vol, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch (e) {}
  }

  const sfx = {
    jump() { beep(420, 0.16, 'square', 0.06, 700); },
    coin() { beep(880, 0.07, 'square', 0.06); setTimeout(() => beep(1318, 0.12, 'square', 0.06), 60); },
    stomp() { beep(260, 0.18, 'square', 0.09, 60); },
    kill() { beep(300, 0.22, 'square', 0.1, 50); },
    power() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'square', 0.07), i * 70)); },
    hurt() { beep(220, 0.25, 'sawtooth', 0.09, 90); },
    die() { beep(400, 0.5, 'sawtooth', 0.1, 60); },
    brick() { beep(120, 0.16, 'square', 0.1, 70); },
    bump() { beep(160, 0.08, 'square', 0.07, 120); },
    clear() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'square', 0.07), i * 90)); },
    over() { [400, 320, 260, 180].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'sawtooth', 0.09, f * 0.7), i * 200)); },
    life() { [784, 1046, 1568].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'square', 0.07), i * 90)); }
  };

  document.addEventListener('keydown', (e) => {
    const c = e.code;
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(c)) e.preventDefault();
    if (c === 'ArrowLeft' || c === 'KeyA') keys.left = true;
    if (c === 'ArrowRight' || c === 'KeyD') keys.right = true;
    if (c === 'ArrowDown' || c === 'KeyS') keys.down = true;
    if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') {
      if (!keys.jumpHeld) jumpQueued = true;
      keys.jumpHeld = true;
    }
    if (c === 'KeyM') toggleSound();
    if (c === 'KeyP' || c === 'Escape') togglePause();
    if (c === 'Enter' && mode === 'menu') startGame();
    if (c === 'Enter' && (mode === 'over' || mode === 'win')) startGame();
  });
  document.addEventListener('keyup', (e) => {
    const c = e.code;
    if (c === 'ArrowLeft' || c === 'KeyA') keys.left = false;
    if (c === 'ArrowRight' || c === 'KeyD') keys.right = false;
    if (c === 'ArrowDown' || c === 'KeyS') keys.down = false;
    if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') keys.jumpHeld = false;
  });

  function toggleSound() {
    muted = !muted;
    const b = $('btnSound');
    b.textContent = muted ? 'som: off' : 'som: on';
    b.classList.toggle('off', muted);
    if (!muted) beep(660, 0.08, 'square', 0.05);
  }
  $('btnSound').addEventListener('click', toggleSound);

  function togglePause() {
    if (mode !== 'play') return;
    paused = !paused;
    ovPause.classList.toggle('show', paused);
  }

  function startGame() {
    try { beep.ctx = beep.ctx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    score = 0; coins = 0; lives = 3;
    loadLevel(0);
    mode = 'play';
    paused = false;
    ovMenu.classList.remove('show');
    ovPause.classList.remove('show');
    ovOver.classList.remove('show');
    ovWin.classList.remove('show');
    ovClear.classList.remove('show');
    updateHud();
  }

  function updateHud() {
    hudScore.textContent = String(score).padStart(6, '0');
    hudCoins.textContent = String(coins).padStart(2, '0');
    hudLives.textContent = String(Math.max(lives, 0));
    hudTime.textContent = String(Math.max(Math.ceil(time), 0));
  }

  function coinPicked(o) {
    o.got = true;
    coins++;
    addScore(100);
    if (coins % 100 === 0) {
      lives++;
      addFloater(o.x, o.y - 10, 'VIDA +1', '#ffc93c');
      sfx.life();
    } else {
      addFloater(o.x, o.y - 10, '+100', '#ffc93c');
      sfx.coin();
    }
    burst(o.x, o.y, '#ffc93c', 6);
    updateHud();
  }

  function coinPop(tx, ty) {
    coins++;
    addScore(100);
    addFloater(tx * TILE + TILE / 2, ty * TILE, '+100', '#ffc93c');
    burst(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#ffc93c', 8);
    sfx.coin();
    updateHud();
  }

  function spawnPowerUp(tx, ty) {
    powerups.push({ x: tx * TILE + 4, y: ty * TILE + TILE, w: 24, h: 24, vx: 120, vy: 0, emerging: true, got: false, target: ty * TILE + 4 });
  }

  function bumpBlock(tx, ty) {
    const ch = tileAt(tx, ty);
    bumpMap[tx + ',' + ty] = 0.28;
    if (ch === '?') {
      if (inSudoList(tx, ty)) {
        spawnPowerUp(tx, ty);
        addFloater(tx * TILE + TILE / 2, ty * TILE - 4, 'SUDO!', '#4dd6ff');
        sfx.bump();
      } else {
        coinPop(tx, ty);
      }
      setGrid(tx, ty, 'x');
    } else if (ch === 'B') {
      if (player.big) {
        setGrid(tx, ty, ' ');
        addScore(50);
        burst(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#c98a4b', 14);
        sfx.brick();
      } else {
        sfx.bump();
      }
    }
  }

  function collideX(p) {
    const tL = Math.floor(p.x / TILE);
    const tR = Math.floor((p.x + p.w - 0.01) / TILE);
    const tT = Math.floor(p.y / TILE);
    const tB = Math.floor((p.y + p.h - 0.01) / TILE);
    for (let ty = tT; ty <= tB; ty++) {
      for (let tx = tL; tx <= tR; tx++) {
        if (isSolid(tileAt(tx, ty))) {
          if (p.vx > 0) p.x = tx * TILE - p.w;
          else if (p.vx < 0) p.x = (tx + 1) * TILE;
          p.vx = 0;
        }
      }
    }
  }

  function collideY(p) {
    const tL = Math.floor(p.x / TILE);
    const tR = Math.floor((p.x + p.w - 0.01) / TILE);
    const tT = Math.floor(p.y / TILE);
    const tB = Math.floor((p.y + p.h - 0.01) / TILE);
    for (let ty = tT; ty <= tB; ty++) {
      for (let tx = tL; tx <= tR; tx++) {
        if (isSolid(tileAt(tx, ty))) {
          if (p.vy > 0) {
            p.y = ty * TILE - p.h;
            p.vy = 0;
            p.onGround = true;
            p.coyote = 0.09;
          } else if (p.vy < 0) {
            p.y = (ty + 1) * TILE;
            p.vy = 0;
            bumpBlock(tx, ty);
          }
        }
      }
    }
  }

  function enemyCollideX(e) {
    const tL = Math.floor(e.x / TILE);
    const tR = Math.floor((e.x + e.w - 0.01) / TILE);
    const tT = Math.floor(e.y / TILE);
    const tB = Math.floor((e.y + e.h - 0.01) / TILE);
    for (let ty = tT; ty <= tB; ty++) {
      for (let tx = tL; tx <= tR; tx++) {
        if (isSolid(tileAt(tx, ty))) {
          if (e.vx > 0) { e.x = tx * TILE - e.w; e.vx = -Math.abs(e.vx); }
          else if (e.vx < 0) { e.x = (tx + 1) * TILE; e.vx = Math.abs(e.vx); }
        }
      }
    }
  }

  function enemyCollideY(e) {
    e.onGround = false;
    const tL = Math.floor(e.x / TILE);
    const tR = Math.floor((e.x + e.w - 0.01) / TILE);
    const tT = Math.floor(e.y / TILE);
    const tB = Math.floor((e.y + e.h - 0.01) / TILE);
    for (let ty = tT; ty <= tB; ty++) {
      for (let tx = tL; tx <= tR; tx++) {
        if (isSolid(tileAt(tx, ty))) {
          if (e.vy >= 0) { e.y = ty * TILE - e.h; e.vy = 0; e.onGround = true; }
          else { e.y = (ty + 1) * TILE; e.vy = 0; }
        }
      }
    }
  }

  function edgeAhead(e) {
    const fx = e.vx > 0 ? e.x + e.w + 2 : e.x - 2;
    const ty = Math.floor((e.y + e.h + 2) / TILE);
    return !isSolid(tileAt(Math.floor(fx / TILE), ty));
  }

  function killEnemy(e, stomp) {
    if (e.dead) return;
    e.dead = true;
    e.deadT = 0;
    if (stomp) {
      addScore(e.type === 'V' ? 200 : 100);
      addFloater(e.x + e.w / 2, e.y - 6, '+' + (e.type === 'V' ? 200 : 100), '#39ff88');
      burst(e.x + e.w / 2, e.y + e.h / 2, '#e05a3c', 8);
      sfx.stomp();
      shake = Math.max(shake, 4);
    } else {
      addScore(e.type === 'V' ? 200 : 100);
      addFloater(e.x + e.w / 2, e.y - 6, '+' + (e.type === 'V' ? 200 : 100), '#39ff88');
      burst(e.x + e.w / 2, e.y + e.h / 2, '#39ff88', 10);
      sfx.kill();
    }
    updateHud();
  }

  function damage() {
    if (player.inv > 0) return;
    if (player.big) {
      player.big = false;
      player.h = BASE_H;
      player.y += BIG_H - BASE_H;
      player.inv = 1.6;
      sfx.hurt();
      burst(player.x + player.w / 2, player.y + player.h / 2, '#4dd6ff', 10);
      addFloater(player.x + player.w / 2, player.y - 6, 'sudo perdido', '#ff5a5f');
    } else {
      die();
    }
  }

  function die() {
    if (mode !== 'play') return;
    mode = 'dead';
    deadT = 0;
    player.vx = 0;
    player.vy = -560;
    lives--;
    updateHud();
    sfx.die();
    ovClear.classList.remove('show');
  }

  function startClear() {
    mode = 'clear';
    clearT = 0;
    player.vx = 0;
    player.vy = 0;
    const bonus = Math.ceil(time);
    addScore(bonus * 10);
    clearBonus.textContent = 'bônus de tempo: +' + (bonus * 10) + ' pts';
    ovClear.classList.add('show');
    sfx.clear();
  }

  function nextLevel() {
    ovClear.classList.remove('show');
    if (levelIndex + 1 >= LEVELS.length) {
      win();
    } else {
      loadLevel(levelIndex + 1);
      mode = 'play';
    }
  }

  function win() {
    mode = 'win';
    winScore.textContent = String(score);
    winCoins.textContent = String(coins);
    winTime.textContent = Math.ceil(time) + 's';
    ovWin.classList.add('show');
    sfx.clear();
  }

  function gameOver() {
    mode = 'over';
    ovOver.classList.add('show');
    sfx.over();
  }

  function updatePlayer(dt) {
    const p = player;
    const left = keys.left;
    const right = keys.right;
    if (left && !right) { p.vx -= ACCEL * dt; p.face = -1; }
    else if (right && !left) { p.vx += ACCEL * dt; p.face = 1; }
    else {
      if (Math.abs(p.vx) < 14) p.vx = 0;
      else p.vx -= Math.sign(p.vx) * FRICTION * dt;
    }
    p.vx = clamp(p.vx, -MAX, MAX);
    if (keys.down && !p.onGround) p.vy += 1300 * dt;
    const g = p.vy > 0 ? G_DOWN : G_UP;
    p.vy += g * dt;
    p.vy = Math.min(p.vy, 920);
    if (jumpQueued) { p.buffer = 0.12; jumpQueued = false; }
    if (p.buffer > 0) p.buffer -= dt;
    if (p.onGround) p.coyote = 0.09;
    else if (p.coyote > 0) p.coyote -= dt;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -JUMP;
      p.buffer = 0;
      p.coyote = 0;
      p.onGround = false;
      sfx.jump();
    }
    if (!keys.jumpHeld && p.vy < -300) p.vy = -300;

    p.x += p.vx * dt;
    collideX(p);
    const wasOnGround = p.onGround;
    p.onGround = false;
    p.y += p.vy * dt;
    collideY(p);
    if (p.onGround && !wasOnGround && Math.abs(p.vy) < 30) p.landed = 0.12;
    if (p.landed > 0) p.landed -= dt;

    if (p.onGround && Math.abs(p.vx) > 10) p.cycle += dt * (Math.abs(p.vx) / 16);
    if (p.inv > 0) p.inv -= dt;

    if (p.y > ROWS * TILE + 40) { die(); return; }

    if (p.x + p.w >= flagPx - 4 && p.x <= flagPx + 4 && p.y + p.h > ROWS * TILE - 80 && mode === 'play') {
      startClear();
    }
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      if (e.dead) {
        e.deadT += dt;
        continue;
      }
      if (e.type === 'E') {
        e.vy += G_DOWN * dt;
        e.vy = Math.min(e.vy, 700);
        e.x += e.vx * dt;
        enemyCollideX(e);
        e.y += e.vy * dt;
        enemyCollideY(e);
        if (e.onGround && edgeAhead(e)) e.vx *= -1;
      } else {
        e.phase += dt * 2.4;
        e.x += e.vx * dt;
        enemyCollideX(e);
        e.y = e.baseY + Math.sin(e.phase) * 12;
      }
    }
    enemies = enemies.filter((e) => !(e.dead && e.deadT > 0.5));

    for (const e of enemies) {
      if (e.dead) continue;
      if (mode !== 'play') continue;
      const p = player;
      if (p.x < e.x + e.w && p.x + p.w > e.x && p.y < e.y + e.h && p.y + p.h > e.y) {
        const stomp = p.vy > 0 && p.y + p.h - e.y < e.h * 0.75;
        if (stomp) {
          killEnemy(e, true);
          p.vy = -JUMP * 0.55;
        } else if (p.big) {
          killEnemy(e, false);
          p.vy = -JUMP * 0.35;
        } else {
          damage();
        }
      }
    }
  }

  function updatePowerups(dt) {
    for (const pu of powerups) {
      if (pu.got) continue;
      if (pu.emerging) {
        pu.y -= 120 * dt;
        if (pu.y <= pu.target) {
          pu.y = pu.target;
          pu.emerging = false;
        }
        continue;
      }
      pu.vy += G_DOWN * dt;
      pu.vy = Math.min(pu.vy, 700);
      pu.x += pu.vx * dt;
      pu.y += pu.vy * dt;
      const tL = Math.floor(pu.x / TILE);
      const tR = Math.floor((pu.x + pu.w - 0.01) / TILE);
      const tT = Math.floor(pu.y / TILE);
      const tB = Math.floor((pu.y + pu.h - 0.01) / TILE);
      for (let ty = tT; ty <= tB; ty++) {
        for (let tx = tL; tx <= tR; tx++) {
          if (isSolid(tileAt(tx, ty))) {
            if (pu.vy > 0) { pu.y = ty * TILE - pu.h; pu.vy = 0; }
            else if (pu.vy < 0) { pu.y = (ty + 1) * TILE; pu.vy = 0; }
            else if (pu.vx > 0) { pu.x = tx * TILE - pu.w; pu.vx = -pu.vx; }
            else if (pu.vx < 0) { pu.x = (tx + 1) * TILE; pu.vx = -pu.vx; }
          }
        }
      }
      const p = player;
      if (p.x < pu.x + pu.w && p.x + p.w > pu.x && p.y < pu.y + pu.h && p.y + p.h > pu.y) {
        pu.got = true;
        if (!p.big) {
          p.big = true;
          p.y -= BIG_H - BASE_H;
          p.h = BIG_H;
        }
        addScore(500);
        addFloater(pu.x, pu.y - 8, 'SUDO +500', '#4dd6ff');
        burst(pu.x + pu.w / 2, pu.y + pu.h / 2, '#4dd6ff', 12);
        sfx.power();
        updateHud();
      }
    }
    powerups = powerups.filter((pu) => !pu.got);
  }

  function updateCoins(dt) {
    for (const o of coinObjs) {
      if (o.got) continue;
      o.phase += dt * 5;
      const p = player;
      if (p.x < o.x + 14 && p.x + p.w > o.x - 14 && p.y < o.y + 14 && p.y + p.h > o.y - 14) {
        coinPicked(o);
      }
    }
  }

  function updateFx(dt) {
    for (const pt of particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 500 * dt;
      pt.life -= dt;
    }
    particles = particles.filter((pt) => pt.life > 0);
    for (const f of floaters) {
      f.t += dt;
      f.y -= 46 * dt;
    }
    floaters = floaters.filter((f) => f.t < 0.9);
    for (const k in bumpMap) {
      bumpMap[k] -= dt;
      if (bumpMap[k] <= 0) delete bumpMap[k];
    }
    if (shake > 0) shake -= dt * 30;
  }

  function update(dt) {
    if (mode === 'menu') {
      worldT += dt;
      if (player) {
        player.x = spawnX();
        player.y = ROWS * TILE - player.h;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
        camX = spawnX() + BASE_W / 2 - W / 2;
      }
      updateEnemies(dt);
      updatePowerups(dt);
      updateCoins(dt);
      updateFx(dt);
      return;
    }
    if (paused) return;
    if (mode === 'dead') {
      deadT += dt;
      player.vy += 1500 * dt;
      player.y += player.vy * dt;
      if (deadT > 1.5) {
        if (lives <= 0) gameOver();
        else { loadLevel(levelIndex); mode = 'play'; }
      }
      updateFx(dt);
      return;
    }
    if (mode === 'clear') {
      clearT += dt;
      const targetX = flagPx - player.w * 0.5 - 2;
      if (clearT < 1.0) {
        player.x = lerp(player.x, targetX, Math.min(1, dt * 10));
        const bot = ROWS * TILE - 8;
        player.y = lerp(player.y, bot - player.h, Math.min(1, dt * 10));
        player.vy = 0;
      } else if (clearT < 2.6) {
        player.x += 280 * dt;
        player.cycle += dt * 11;
        player.onGround = true;
      } else {
        nextLevel();
      }
      updateFx(dt);
      return;
    }
    if (mode === 'play') {
      time -= dt;
      if (time <= 0) { time = 0; updateHud(); die(); return; }
      updatePlayer(dt);
      if (mode !== 'play') { updateFx(dt); return; }
      updateEnemies(dt);
      updatePowerups(dt);
      updateCoins(dt);
      updateFx(dt);
      updateHud();
    }
    if (mode === 'over' || mode === 'win') updateFx(dt);
  }

  function spawnX() { return 3 * TILE + (TILE - BASE_W) / 2; }

  function updateCamera(dt) {
    if (!player) return;
    const cx = player.x + player.w / 2 - W / 2;
    camX = clamp(cx, 0, level.cols * TILE - W);
    camX = lerp(camX, clamp(cx, 0, level.cols * TILE - W), 1);
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0e1c');
    g.addColorStop(0.6, '#0e1526');
    g.addColorStop(1, '#101a2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(57,255,136,0.05)';
    ctx.lineWidth = 1;
    for (let x = -camX % 64; x < W; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 64; y < H; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(57,255,136,0.05)';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    const glyphs = ['#', '$', '{', '}', '/*', '&&', '||', '=>'];
    for (let i = 0; i < 26; i++) {
      const sx = ((i * 383 + 200) - camX * 0.12) % (W + 200) - 100;
      const sy = (i * 97) % (H - 120) + 20;
      ctx.fillText(glyphs[i % glyphs.length], sx, sy);
    }

    for (const h of hills) {
      const sx = h.x - camX * 0.25;
      if (sx < -h.w || sx > W + h.w) continue;
      ctx.fillStyle = 'rgba(18,26,48,0.9)';
      ctx.beginPath();
      ctx.moveTo(sx - h.w, H - 200);
      ctx.lineTo(sx, H - 200 - h.h);
      ctx.lineTo(sx + h.w, H - 200);
      ctx.closePath();
      ctx.fill();
    }

    for (const cl of clouds) {
      const sx = cl.x - camX * 0.15;
      if (sx < -220 || sx > W + 220) continue;
      const w = 150 * cl.s, h = 64 * cl.s;
      ctx.save();
      ctx.translate(sx, cl.y);
      ctx.fillStyle = 'rgba(15,22,42,0.92)';
      ctx.strokeStyle = 'rgba(57,255,136,0.14)';
      ctx.lineWidth = 1.5;
      roundRect(-w / 2, -h / 2, w, h, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(57,255,136,0.55)';
      ctx.fillRect(-w / 2 + 8, -h / 2 + 10, w - 16, 8);
      ctx.font = '600 ' + (11 * cl.s) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(232,238,252,0.5)';
      ctx.fillText('$ clear', -w / 2 + 8, -h / 2 + 34);
      ctx.restore();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTiles() {
    const c0 = Math.floor(camX / TILE) - 1;
    const c1 = Math.ceil((camX + W) / TILE) + 1;
    for (let r = 0; r < ROWS; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = tileAt(c, r);
        if (ch === ' ') continue;
        const x = c * TILE, y = r * TILE;
        let off = 0;
        const b = bumpMap[c + ',' + r];
        if (b) off = -Math.abs(Math.sin((b / 0.28) * Math.PI)) * 8;
        drawTile(ch, x, y + off, c, r);
      }
    }
  }

  function drawTile(ch, x, y, c, r) {
    const above = tileAt(c, r - 1);
    const below = tileAt(c, r + 1);
    ctx.save();
    if (ch === '#') {
      ctx.fillStyle = r === ROWS - 1 ? '#232a42' : '#1d2338';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      if (above === ' ') {
        ctx.fillStyle = '#39ff88';
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = 'rgba(57,255,136,0.25)';
        ctx.fillRect(x, y + 4, TILE, 3);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(x, y, TILE, TILE);
    } else if (ch === 'X') {
      ctx.fillStyle = '#2b3350';
      roundRect(x + 1, y + 1, TILE - 2, TILE - 2, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(77,214,255,0.35)';
      ctx.lineWidth = 1.5;
      roundRect(x + 1, y + 1, TILE - 2, TILE - 2, 4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(77,214,255,0.08)';
      ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
    } else if (ch === 'B') {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#8f6138';
      ctx.fillRect(x, y, TILE, 12);
      ctx.fillRect(x, y + 16, TILE, 12);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, TILE, TILE);
      ctx.beginPath();
      ctx.moveTo(x + TILE / 2, y);
      ctx.lineTo(x + TILE / 2, y + TILE);
      ctx.moveTo(x, y + TILE / 2);
      ctx.lineTo(x + TILE, y + TILE / 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 3, y + 3, TILE - 6, 6);
    } else if (ch === '?' || ch === 'x') {
      const used = ch === 'x';
      const bg = used ? '#4a3421' : '#c97b2d';
      const hi = used ? '#5f452c' : '#ffd479';
      ctx.fillStyle = bg;
      roundRect(x + 1, y + 1, TILE - 2, TILE - 2, 6);
      ctx.fill();
      ctx.strokeStyle = hi;
      ctx.lineWidth = 1.5;
      roundRect(x + 1, y + 1, TILE - 2, TILE - 2, 6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 5, y + 4, TILE - 10, 4);
      ctx.fillStyle = used ? '#3a2818' : '#3a1c05';
      ctx.font = '800 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(used ? '\u00d7' : '?', x + TILE / 2, y + TILE / 2 + 1);
    } else if (ch === '=') {
      const cap = above === ' ';
      ctx.fillStyle = cap ? '#2fd26f' : '#229e57';
      roundRect(x + 3, y, TILE - 6, TILE, 4);
      ctx.fill();
      ctx.strokeStyle = '#1a7a42';
      ctx.lineWidth = 2;
      roundRect(x + 3, y, TILE - 6, TILE, 4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 8, y + 3, 5, TILE - 6);
    } else if (ch === '^') {
      ctx.fillStyle = '#141a2c';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#c7ccdb';
      for (let i = 0; i < 3; i++) {
        const bx = x + i * 11;
        ctx.beginPath();
        ctx.moveTo(bx + 2, y + TILE);
        ctx.lineTo(bx + 5.5, y + 2);
        ctx.lineTo(bx + 9, y + TILE);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y + TILE - 3, TILE, 3);
    }
    ctx.restore();
  }

  function drawCoin(o) {
    const s = Math.max(0.2, Math.abs(Math.cos(o.phase)));
    ctx.save();
    ctx.translate(o.x, o.y + Math.sin(o.phase * 0.8) * 2);
    ctx.scale(s, 1);
    const r = 13;
    ctx.fillStyle = '#ffc93c';
    roundRect(-r, -r, r * 2, r * 2, 5);
    ctx.fill();
    ctx.strokeStyle = '#d19a1f';
    ctx.lineWidth = 2;
    roundRect(-r, -r, r * 2, r * 2, 5);
    ctx.stroke();
    ctx.fillStyle = '#ffd979';
    ctx.fillRect(-r, -r, r * 2, 6);
    ctx.strokeStyle = '#8a5a00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, 4);
    ctx.lineTo(0, -1);
    ctx.lineTo(5, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(0, 7);
    ctx.stroke();
    ctx.restore();
  }

  function drawPowerup(pu) {
    ctx.save();
    ctx.translate(pu.x + pu.w / 2, pu.y + pu.h / 2);
    ctx.shadowColor = '#4dd6ff';
    ctx.shadowBlur = 12;
    const grad = ctx.createLinearGradient(0, -pu.h / 2, 0, pu.h / 2);
    grad.addColorStop(0, '#7fe7ff');
    grad.addColorStop(1, '#1f9cd8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -pu.h / 2);
    ctx.lineTo(pu.w / 2, -pu.h / 2 + pu.h * 0.3);
    ctx.quadraticCurveTo(pu.w / 2, pu.h * 0.35, 0, pu.h / 2);
    ctx.quadraticCurveTo(-pu.w / 2, pu.h * 0.35, -pu.w / 2, -pu.h / 2 + pu.h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);
    ctx.restore();
  }

  function drawFlag() {
    const x = flagPx;
    const topY = flagPy;
    const groundY = ROWS * TILE;
    ctx.strokeStyle = '#8fa0bf';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, groundY);
    ctx.stroke();
    ctx.fillStyle = '#39ff88';
    ctx.shadowColor = '#39ff88';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x + 46, topY + 20);
    ctx.lineTo(x, topY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#082114';
    ctx.font = '800 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('</>', x + 24, topY + 21);
    ctx.fillStyle = '#39ff88';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('BOOT', x, topY - 14);
  }

  function drawTux(c, x, y, w, h, o) {
    const cx = x + w / 2;
    const base = Math.min(w, h);
    const run = o.cycle;
    const swing = o.onGround ? Math.sin(run * Math.PI * 2) * Math.max(base * 0.2, 6) : 0;
    const arm = o.onGround ? Math.sin(run * Math.PI * 2) * 0.35 : (o.jump ? 0.8 : -0.2);

    c.fillStyle = '#ff9f1c';
    if (o.onGround) {
      c.beginPath(); c.ellipse(cx - base * 0.4 - swing, y + h - 3, base * 0.17, base * 0.11, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx + base * 0.4 + swing, y + h - 3, base * 0.17, base * 0.11, 0, 0, Math.PI * 2); c.fill();
    } else {
      c.beginPath(); c.ellipse(cx - base * 0.42, y + h - 4, base * 0.16, base * 0.13, 0.5, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx + base * 0.42, y + h - 4, base * 0.16, base * 0.13, -0.5, 0, Math.PI * 2); c.fill();
    }

    c.fillStyle = '#14161f';
    c.save();
    c.translate(cx, y + h * 0.46);
    c.save(); c.rotate(-0.45 + arm * 0.3);
    c.beginPath(); c.ellipse(-base * 0.9, 0, base * 0.16, base * 0.34, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    c.save(); c.rotate(0.45 - arm * 0.3);
    c.beginPath(); c.ellipse(base * 0.9, 0, base * 0.16, base * 0.34, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    c.restore();

    c.fillStyle = '#1b1d29';
    c.beginPath(); c.ellipse(cx, y + h * 0.52, base * 0.9, base * 0.46, 0, 0, Math.PI * 2); c.fill();

    c.fillStyle = '#f4f7fb';
    c.beginPath(); c.ellipse(cx, y + h * 0.6, base * 0.52, base * 0.32, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx - base * 0.42, y + h * 0.28, base * 0.18, base * 0.2, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + base * 0.42, y + h * 0.28, base * 0.18, base * 0.2, 0, 0, Math.PI * 2); c.fill();

    c.fillStyle = '#111';
    c.beginPath(); c.arc(cx - base * 0.34, y + h * 0.26, base * 0.055, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + base * 0.34, y + h * 0.26, base * 0.055, 0, Math.PI * 2); c.fill();
    if (o.wink > 0) {
      c.strokeStyle = '#111';
      c.lineWidth = 2;
      c.beginPath(); c.arc(cx + base * 0.34, y + h * 0.26, base * 0.055, 0.2, Math.PI - 0.2); c.stroke();
    }

    c.fillStyle = '#ff9f1c';
    c.beginPath();
    c.moveTo(cx - base * 0.12, y + h * 0.33);
    c.lineTo(cx + base * 0.18, y + h * 0.33);
    c.lineTo(cx + base * 0.02, y + h * 0.45);
    c.closePath();
    c.fill();
  }

  function drawBug(e) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const sq = e.dead ? clamp(e.deadT * 8, 0, 1) : 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 + sq * 0.2, 1 - sq * 0.6);
    ctx.fillStyle = '#3a2a1a';
    for (let i = 0; i < 3; i++) {
      const a = Math.sin(worldT * 6 + i) * 0.3;
      ctx.beginPath(); ctx.ellipse(-e.w * 0.28 - 8, -i * 3 + 4, 9, 2.4, -0.6 + a, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(e.w * 0.28 + 8, -i * 3 + 4, 9, 2.4, 0.6 - a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#e05a3c';
    ctx.beginPath(); ctx.ellipse(0, 0, e.w * 0.38, e.h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b93f26';
    ctx.beginPath(); ctx.ellipse(0, e.h * 0.1, e.w * 0.24, e.h * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd9c4';
    ctx.beginPath(); ctx.arc(-e.w * 0.16, -e.h * 0.14, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.w * 0.16, -e.h * 0.14, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a1f12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-e.w * 0.14, -e.h * 0.34);
    ctx.lineTo(-e.w * 0.28, -e.h * 0.62);
    ctx.moveTo(e.w * 0.14, -e.h * 0.34);
    ctx.lineTo(e.w * 0.28, -e.h * 0.62);
    ctx.stroke();
    ctx.fillStyle = '#5a1f12';
    ctx.beginPath(); ctx.arc(-e.w * 0.28, -e.h * 0.62, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.w * 0.28, -e.h * 0.62, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawVirus(e) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const sq = e.dead ? clamp(e.deadT * 8, 0, 1) : 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 + sq * 0.2, 1 - sq * 0.6);
    ctx.fillStyle = '#2ecf5f';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = i % 2 === 0 ? e.w * 0.48 : e.w * 0.36;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1d9c48';
    ctx.beginPath(); ctx.arc(0, 0, e.w * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eafff2';
    ctx.beginPath(); ctx.arc(-e.w * 0.12, -e.h * 0.06, e.w * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.w * 0.12, -e.h * 0.06, e.w * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0c3a1c';
    ctx.beginPath(); ctx.arc(-e.w * 0.12, -e.h * 0.04, e.w * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.w * 0.12, -e.h * 0.04, e.w * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0c3a1c';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-e.w * 0.16, e.h * 0.16);
    ctx.lineTo(-e.w * 0.05, e.h * 0.06);
    ctx.lineTo(e.w * 0.05, e.h * 0.16);
    ctx.lineTo(e.w * 0.16, e.h * 0.06);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.type === 'E') drawBug(e);
      else drawVirus(e);
    }
  }

  function drawParticles() {
    for (const pt of particles) {
      ctx.globalAlpha = clamp(pt.life / 0.3, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (const f of floaters) {
      const a = 1 - f.t / 0.9;
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawHazardGlow() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = Math.floor(camX / TILE) - 1; c <= Math.ceil((camX + W) / TILE) + 1; c++) {
        if (tileAt(c, r) === '^') {
          const px = c * TILE, py = r * TILE;
          const p = player;
          if (p.x + p.w > px && p.x < px + TILE && p.y + p.h > py + 4 && p.y < py + TILE && player.inv <= 0 && mode === 'play') {
            damage();
          }
        }
      }
    }
  }

  function render() {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    drawBackground();
    updateCamera(0);
    ctx.save();
    ctx.translate(-camX, 0);
    drawTiles();
    drawFlag();
    for (const o of coinObjs) if (!o.got) drawCoin(o);
    for (const pu of powerups) if (!pu.got) drawPowerup(pu);
    drawEnemies();
    if (player && mode !== 'over' && mode !== 'win') {
      if (player.inv <= 0 || Math.floor(player.inv * 14) % 2 === 0) {
        drawTux(ctx, player.x, player.y, player.w, player.h, {
          onGround: player.onGround, cycle: player.cycle, jump: !player.onGround && player.vy < 0,
          wink: player.landed || 0
        });
      }
    }
    drawParticles();
    drawFloaters();
    ctx.restore();
    ctx.restore();
    drawHazardGlow();
  }

  let last = performance.now();
  function loop(now) {
    const dt = clamp((now - last) / 1000, 0, 0.033);
    last = now;
    worldT += dt;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  $('btnStart').addEventListener('click', startGame);
  $('btnRetry').addEventListener('click', startGame);
  $('btnAgain').addEventListener('click', startGame);

  function bindTouch(id, key) {
    const el = $(id);
    const on = (e) => { e.preventDefault(); keys[key] = true; };
    const off = (e) => { e.preventDefault(); keys[key] = false; if (key === 'jumpHeld') jumpQueued = false; };
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
  }
  bindTouch('tLeft', 'left');
  bindTouch('tRight', 'right');
  const tJump = $('tJump');
  tJump.addEventListener('touchstart', (e) => { e.preventDefault(); if (!keys.jumpHeld) jumpQueued = true; keys.jumpHeld = true; }, { passive: false });
  tJump.addEventListener('touchend', (e) => { e.preventDefault(); keys.jumpHeld = false; }, { passive: false });
  tJump.addEventListener('touchcancel', (e) => { e.preventDefault(); keys.jumpHeld = false; }, { passive: false });

  window.addEventListener('blur', () => {
    keys.left = keys.right = keys.down = keys.jumpHeld = false;
    if (mode === 'play' && !paused) togglePause();
  });

  loadLevel(0);
  mode = 'menu';
  ovMenu.classList.add('show');
  updateHud();
  requestAnimationFrame(loop);
})();
