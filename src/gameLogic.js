// Game constants and logic for DropPear
export const COLS = 6;
export const MAX_ROWS = 10;
export const WARN_ROWS = 7;
export const BAG_MAX = 6;
export const MATCH_COUNT = 3;
export const GAME_TIME = 60;
export const COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'silver'];

export const LEVEL_CONFIG = [
  { label: 'Lv.1', interval: 6000, colors: 4, initRows: 2 },
  { label: 'Lv.2', interval: 5500, colors: 4, initRows: 2 },
  { label: 'Lv.3', interval: 5000, colors: 4, initRows: 2 },
  { label: 'Lv.4', interval: 5000, colors: 4, initRows: 3 },
  { label: 'Lv.5', interval: 4500, colors: 4, initRows: 3 },
  { label: 'Lv.6', interval: 4500, colors: 5, initRows: 3 },
  { label: 'Lv.7', interval: 4000, colors: 5, initRows: 3 },
  { label: 'Lv.8', interval: 4000, colors: 5, initRows: 4 },
  { label: 'Lv.9', interval: 4000, colors: 5, initRows: 4 },
  { label: 'Lv.10', interval: 4000, colors: 5, initRows: 4 },
];

export const COLOR_MAP = {
  red: { outer: '#c0392b', inner: '#ff6b6b' },
  green: { outer: '#27ae60', inner: '#6dffaa' },
  blue: { outer: '#2980b9', inner: '#74c0fc' },
  yellow: { outer: '#f39c12', inner: '#fff176' },
  purple: { outer: '#8e44ad', inner: '#e0aaff' },
  orange: { outer: '#e67e22', inner: '#ffd180' },
  silver: { outer: '#b0b0b0', inner: '#f5f5f5' },
};

export const CANVAS_DIMS = {
  CELL: 44,
  PAD: 2,
  RADIUS: 18,
  BEAD_SCALE: 1.2,
};

export const CANVAS_W = COLS * (CANVAS_DIMS.CELL + CANVAS_DIMS.PAD) + CANVAS_DIMS.PAD;
export const CANVAS_H = MAX_ROWS * (CANVAS_DIMS.CELL + CANVAS_DIMS.PAD) + CANVAS_DIMS.PAD;

export const BAG_DIMS = {
  CELL: 40,
  PAD: 4,
};

export const BAG_W = BAG_MAX * (BAG_DIMS.CELL + BAG_DIMS.PAD) + BAG_DIMS.PAD;
export const BAG_H = BAG_DIMS.CELL + BAG_DIMS.PAD * 2;

// Board helpers
export function emptyBoard() {
  return Array.from({ length: MAX_ROWS }, () => Array(COLS).fill(null));
}

export function randomColor(currentLevel) {
  const available = COLORS.slice(0, LEVEL_CONFIG[currentLevel - 1].colors);
  return available[Math.floor(Math.random() * available.length)];
}

export function buildRow(currentLevel) {
  return Array.from({ length: COLS }, () => randomColor(currentLevel));
}

export function pushRow(board, currentLevel) {
  const newBoard = board.map(row => [...row]);
  for (let r = MAX_ROWS - 1; r > 0; r--) {
    newBoard[r] = newBoard[r - 1];
  }
  newBoard[0] = buildRow(currentLevel);
  return newBoard;
}

export function occupiedRows(board) {
  for (let r = MAX_ROWS - 1; r >= 0; r--) {
    if (board[r].some(c => c !== null)) return r + 1;
  }
  return 0;
}

export function selectBead(board, hintBag, clickRow, col) {
  let targetRow = -1;
  for (let r = MAX_ROWS - 1; r >= 0; r--) {
    if (board[r][col] !== null) {
      targetRow = r;
      break;
    }
  }
  
  if (targetRow === -1 || targetRow !== clickRow) return { valid: false };

  const newBoard = board.map(row => [...row]);
  const color = newBoard[targetRow][col];
  newBoard[targetRow][col] = null;

  return {
    valid: true,
    board: newBoard,
    color: color,
  };
}

export function checkMatch(hintBag) {
  const newBag = [...hintBag];
  const counts = {};
  
  for (const c of newBag) {
    counts[c] = (counts[c] || 0) + 1;
  }

  let matched = false;
  for (const [color, count] of Object.entries(counts)) {
    if (count >= MATCH_COUNT) {
      matched = true;
      let removed = 0;
      const filtered = newBag.filter(c => {
        if (c === color && removed < MATCH_COUNT) {
          removed++;
          return false;
        }
        return true;
      });
      return {
        matched: true,
        score: 3,
        bag: filtered,
        needsRecursiveCheck: true,
      };
    }
  }

  return { matched: false, bag: newBag, score: 0 };
}

export function checkGameOver(board) {
  if (board[MAX_ROWS - 1].some(c => c !== null)) {
    return { gameOver: true, reason: 'overflow', message: '珠子超出底部！' };
  }
  return { gameOver: false };
}
