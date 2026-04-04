// ============================================================
//  DropPear – game.js
// ============================================================

// ---- Constants ----
const COLS        = 10;
const MAX_ROWS    = 10;
const WARN_ROWS   = 7;
const BAG_MAX     = 6;
const MATCH_COUNT = 3;
const GAME_TIME   = 60; // seconds
const COLORS      = ['red', 'green', 'blue', 'yellow', 'purple'];

const LEVEL_CONFIG = [
  { label: 'Lv.1',  interval: 6000, colors: 3, initRows: 2 },
  { label: 'Lv.2',  interval: 5500, colors: 3, initRows: 2 },
  { label: 'Lv.3',  interval: 5000, colors: 4, initRows: 2 },
  { label: 'Lv.4',  interval: 4500, colors: 4, initRows: 3 },
  { label: 'Lv.5',  interval: 4000, colors: 4, initRows: 3 },
  { label: 'Lv.6',  interval: 3500, colors: 5, initRows: 3 },
  { label: 'Lv.7',  interval: 3000, colors: 5, initRows: 3 },
  { label: 'Lv.8',  interval: 2500, colors: 5, initRows: 4 },
  { label: 'Lv.9',  interval: 2200, colors: 5, initRows: 4 },
  { label: 'Lv.10', interval: 2000, colors: 5, initRows: 4 },
];

// ---- DOM refs ----
const screenHome   = document.getElementById('screen-home');
const screenGame   = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');

const gameCanvas   = document.getElementById('game-canvas');
const bagCanvas    = document.getElementById('bag-canvas');
const ctx          = gameCanvas.getContext('2d');
const bagCtx       = bagCanvas.getContext('2d');

const redFlash     = document.getElementById('red-flash');
const uiScore      = document.getElementById('ui-score');
const uiTimer      = document.getElementById('ui-timer');
const uiDifficulty = document.getElementById('ui-difficulty');
const resultTitle  = document.getElementById('result-title');
const resultReason = document.getElementById('result-reason');
const resultScore  = document.getElementById('result-score');

// ---- Canvas sizing ----
const CELL   = 44;   // px per cell
const PAD    = 2;    // gap between cells
const RADIUS = 18;   // bead corner radius

const CANVAS_W = COLS * (CELL + PAD) + PAD;
const CANVAS_H = MAX_ROWS * (CELL + PAD) + PAD;

const BAG_CELL = 40;
const BAG_PAD  = 4;
const BAG_W    = BAG_MAX * (BAG_CELL + BAG_PAD) + BAG_PAD;
const BAG_H    = BAG_CELL + BAG_PAD * 2;

gameCanvas.width  = CANVAS_W;
gameCanvas.height = CANVAS_H;
bagCanvas.width   = BAG_W;
bagCanvas.height  = BAG_H;

// ---- Fly canvas (full-viewport overlay for bead animations) ----
const flyCanvas = document.createElement('canvas');
flyCanvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:900;';
document.body.appendChild(flyCanvas);
const flyCtx = flyCanvas.getContext('2d');
function resizeFlyCanvas() {
  flyCanvas.width  = window.innerWidth;
  flyCanvas.height = window.innerHeight;
}
resizeFlyCanvas();
window.addEventListener('resize', resizeFlyCanvas);

// ---- Color palette ----
const COLOR_MAP = {
  red:    { outer: '#c0392b', inner: '#ff6b6b' },
  green:  { outer: '#27ae60', inner: '#6dffaa' },
  blue:   { outer: '#2980b9', inner: '#74c0fc' },
  yellow: { outer: '#f39c12', inner: '#fff176' },
  purple: { outer: '#8e44ad', inner: '#e0aaff' },
};

// ---- Game state ----
let board        = [];
let hintBag      = [];
let score        = 0;
let timerSec     = GAME_TIME;
let currentLevel = 1;
let gameActive   = false;
let beadFlying   = false;
let flyingBeads  = [];

let dropInterval  = null;
let timerInterval = null;
let animFrameId   = null;

// ============================================================
//  Screen helpers
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ============================================================
//  Board helpers
// ============================================================
function emptyBoard() {
  return Array.from({ length: MAX_ROWS }, () => Array(COLS).fill(null));
}

function randomColor() {
  const available = COLORS.slice(0, LEVEL_CONFIG[currentLevel - 1].colors);
  return available[Math.floor(Math.random() * available.length)];
}

function buildRow() {
  return Array.from({ length: COLS }, () => randomColor());
}

/** Push a new row onto the top (row 0) and shift everything down by one. */
function pushRow() {
  // Shift all rows down by one: row i -> row i+1
  for (let r = MAX_ROWS - 1; r > 0; r--) {
    board[r] = board[r - 1];
  }
  board[0] = buildRow();
}

/** Returns effective bottom-most row index that has any bead */
function occupiedRows() {
  for (let r = MAX_ROWS - 1; r >= 0; r--) {
    if (board[r].some(c => c !== null)) return r + 1;
  }
  return 0;
}

// ============================================================
//  Initialise a new game
// ============================================================
function startGame(level) {
  currentLevel = level;
  const cfg    = LEVEL_CONFIG[level - 1];
  board       = emptyBoard();
  hintBag     = [];
  score       = 0;
  timerSec    = GAME_TIME;
  gameActive  = true;
  beadFlying  = false;
  flyingBeads = [];

  uiScore.textContent      = 0;
  uiTimer.textContent      = GAME_TIME;
  uiDifficulty.textContent = cfg.label;
  redFlash.classList.remove('warn');

  for (let i = 0; i < cfg.initRows; i++) pushRow();

  showScreen('screen-game');
  startTimers();
  requestAnimationFrame(animLoop);
}

// ============================================================
//  Timers
// ============================================================
function startTimers() {
  clearInterval(dropInterval);
  clearInterval(timerInterval);

  const cfg = LEVEL_CONFIG[currentLevel - 1];

  dropInterval = setInterval(() => {
    if (!gameActive) return;
    pushRow();
    checkGameOver();
  }, cfg.interval);

  timerInterval = setInterval(() => {
    if (!gameActive) return;
    timerSec--;
    uiTimer.textContent = timerSec;
    if (timerSec <= 0) endGame('time', '時間到！');
  }, 1000);
}

function stopTimers() {
  clearInterval(dropInterval);
  clearInterval(timerInterval);
  cancelAnimationFrame(animFrameId);
  flyingBeads = [];
  flyCtx.clearRect(0, 0, flyCanvas.width, flyCanvas.height);
}

// ============================================================
//  Game-over checks
// ============================================================
function checkGameOver() {
  if (board[MAX_ROWS - 1].some(c => c !== null)) {
    endGame('overflow', '珠子超出底部！');
    return;
  }
  redFlash.classList.toggle('warn', occupiedRows() >= WARN_ROWS);
}

function endGame(reason, msg) {
  gameActive = false;
  stopTimers();
  resultTitle.textContent  = reason === 'time' ? '時間到！' : '遊戲結束';
  resultReason.textContent = msg;
  resultScore.textContent  = score;
  showScreen('screen-result');
}

// ============================================================
//  Click: select a bead
// ============================================================
gameCanvas.addEventListener('click', e => {
  if (!gameActive || beadFlying) return;
  const rect = gameCanvas.getBoundingClientRect();
  const col  = Math.floor((e.clientX - rect.left - PAD) / (CELL + PAD));
  const row  = Math.floor((e.clientY - rect.top  - PAD) / (CELL + PAD));
  if (col < 0 || col >= COLS || row < 0 || row >= MAX_ROWS) return;
  selectBead(row, col);
});

function selectBead(clickRow, col) {
  let targetRow = -1;
  for (let r = MAX_ROWS - 1; r >= 0; r--) {
    if (board[r][col] !== null) { targetRow = r; break; }
  }
  if (targetRow === -1 || targetRow !== clickRow) return;

  const color = board[targetRow][col];
  board[targetRow][col] = null;

  // Source: bead center in viewport coords
  const canvasRect = gameCanvas.getBoundingClientRect();
  const sx = canvasRect.left + PAD + col * (CELL + PAD) + CELL / 2;
  const sy = canvasRect.top  + PAD + targetRow * (CELL + PAD) + CELL / 2;

  // Target: next free bag slot center in viewport coords
  const bagRect = bagCanvas.getBoundingClientRect();
  const slotIdx = hintBag.length;
  const tx = bagRect.left + BAG_PAD + slotIdx * (BAG_CELL + BAG_PAD) + BAG_CELL / 2;
  const ty = bagRect.top  + BAG_PAD + BAG_CELL / 2;

  beadFlying = true;
  flyingBeads.push({
    color, sx, sy, tx, ty,
    startTime: performance.now(),
    duration: 380,
    onComplete() {
      beadFlying = false;
      hintBag.push(color);
      checkMatch();
      if (hintBag.length >= BAG_MAX) {
        endGame('bag', '提示袋已滿！');
        return;
      }
      checkGameOver();
    },
  });
}

// ============================================================
//  Match logic
// ============================================================
function checkMatch() {
  // Count occurrences of each color in bag
  const counts = {};
  for (const c of hintBag) counts[c] = (counts[c] || 0) + 1;
  for (const [color, count] of Object.entries(counts)) {
    if (count >= MATCH_COUNT) {
      // Remove MATCH_COUNT of this color from bag
      let removed = 0;
      hintBag = hintBag.filter(c => {
        if (c === color && removed < MATCH_COUNT) { removed++; return false; }
        return true;
      });
      score += 3;
      uiScore.textContent = score;
      // Recursively check again (combos possible)
      checkMatch();
      return;
    }
  }
}

// ============================================================
//  Rendering
// ============================================================
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function quadBezier(p0x, p0y, p1x, p1y, p2x, p2y, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x,
    y: mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y,
  };
}

function animLoop(timestamp) {
  render();

  // Draw flying beads on overlay canvas
  flyCtx.clearRect(0, 0, flyCanvas.width, flyCanvas.height);
  flyingBeads = flyingBeads.filter(fb => {
    const rawT = Math.min((timestamp - fb.startTime) / fb.duration, 1);
    const t    = easeInOutQuad(rawT);
    // Quadratic bezier: drop straight down, then curve sideways to bag slot
    const pos = quadBezier(fb.sx, fb.sy, fb.sx, fb.ty - 10, fb.tx, fb.ty, t);
    const sz  = CELL + (BAG_CELL - CELL) * t;
    drawBead(flyCtx, pos.x - sz / 2, pos.y - sz / 2, sz, fb.color);
    if (rawT >= 1) { fb.onComplete(); return false; }
    return true;
  });

  animFrameId = requestAnimationFrame(animLoop);
}

function drawBead(context, x, y, size, color) {
  const r  = size / 2;
  const cx = x + r;
  const cy = y + r;
  const rr = Math.round(size * 0.38);

  context.save();

  // Rounded-rect path
  context.beginPath();
  context.roundRect(x, y, size, size, rr);
  context.closePath();

  // Radial gradient: transparent center → opaque outer
  const grad = context.createRadialGradient(cx, cy, size * 0.05, cx, cy, r * 1.1);
  const { outer, inner } = COLOR_MAP[color];
  grad.addColorStop(0, inner + '55');   // center: semi-transparent
  grad.addColorStop(0.55, inner);
  grad.addColorStop(1,   outer);

  context.fillStyle = grad;
  context.fill();

  // Subtle highlight
  context.beginPath();
  context.roundRect(x + 4, y + 4, size - 8, size / 2.5, rr * 0.6);
  context.fillStyle = 'rgba(255,255,255,0.18)';
  context.fill();

  context.restore();
}

function render() {
  // ---- Main board ----
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid lines
  ctx.strokeStyle = '#ffffff18';
  ctx.lineWidth   = 1;
  for (let r = 0; r <= MAX_ROWS; r++) {
    const y = r * (CELL + PAD) + PAD * 0.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    const x = c * (CELL + PAD) + PAD * 0.5;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }

  // Beads
  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const color = board[r][c];
      if (!color) continue;
      const x = PAD + c * (CELL + PAD);
      const y = PAD + r * (CELL + PAD);
      drawBead(ctx, x, y, CELL, color);
    }
  }

  // Highlight the bottom-most bead in each column (clickable indicator)
  for (let c = 0; c < COLS; c++) {
    for (let r = MAX_ROWS - 1; r >= 0; r--) {
      if (board[r][c] !== null) {
        const x = PAD + c * (CELL + PAD);
        const y = PAD + r * (CELL + PAD);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, CELL, CELL, Math.round(CELL * 0.38));
        ctx.stroke();
        ctx.restore();
        break;
      }
    }
  }

  // ---- Hint Bag ----
  bagCtx.clearRect(0, 0, BAG_W, BAG_H);
  // Empty slots
  for (let i = 0; i < BAG_MAX; i++) {
    const x = BAG_PAD + i * (BAG_CELL + BAG_PAD);
    const y = BAG_PAD;
    bagCtx.save();
    bagCtx.strokeStyle = '#ffffff33';
    bagCtx.lineWidth   = 1.5;
    bagCtx.beginPath();
    bagCtx.roundRect(x, y, BAG_CELL, BAG_CELL, 10);
    bagCtx.stroke();
    bagCtx.restore();
  }
  // Filled beads
  for (let i = 0; i < hintBag.length; i++) {
    const x = BAG_PAD + i * (BAG_CELL + BAG_PAD);
    const y = BAG_PAD;
    drawBead(bagCtx, x, y, BAG_CELL, hintBag[i]);
  }
}

// ============================================================
//  Button wiring
// ============================================================
document.querySelectorAll('[data-level]').forEach(btn => {
  btn.addEventListener('click', () => {
    stopTimers();
    startGame(Number(btn.dataset.level));
  });
});

document.getElementById('btn-back').addEventListener('click', () => {
  if (gameActive) {
    gameActive = false;
    stopTimers();
  }
  showScreen('screen-home');
});

document.getElementById('btn-retry').addEventListener('click', () => {
  stopTimers();
  startGame(currentLevel);
});

document.getElementById('btn-home').addEventListener('click', () => {
  stopTimers();
  showScreen('screen-home');
});
