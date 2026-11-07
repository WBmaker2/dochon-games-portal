// src/components/games/tetris/tetrisConstants.js

export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 20;
export const BLOCK_SIZE = 30; // standard canvas block pixel size
export const PREVIEW_SIZE = 20;

export const COLORS = [
  null,
  '#06B6D4', // 1: I - Cyan
  '#3B82F6', // 2: J - Blue
  '#F97316', // 3: L - Orange
  '#EAB308', // 4: O - Yellow
  '#22C55E', // 5: S - Green
  '#A855F7', // 6: T - Purple
  '#EF4444', // 7: Z - Red
];

export const PIECES = {
  I: [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ],
  J: [
    [0, 2, 0],
    [0, 2, 0],
    [2, 2, 0],
  ],
  L: [
    [0, 3, 0],
    [0, 3, 0],
    [0, 3, 3],
  ],
  O: [
    [4, 4],
    [4, 4],
  ],
  S: [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  Z: [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ],
};

export const PIECE_KEYS = Object.keys(PIECES);

export const LINE_SCORE_BASE = {
  1: 10,   // Single
  2: 40,   // Double
  3: 90,   // Triple
  4: 160,  // Tetris
};

export function calculateScore(linesCleared, comboCount = 0) {
  if (!linesCleared || linesCleared < 1) return 0;
  const base = LINE_SCORE_BASE[linesCleared] || (linesCleared * 10 * linesCleared);
  const comboMultiplier = comboCount > 1 ? 1 + (comboCount - 1) * 0.5 : 1;
  return Math.round(base * comboMultiplier);
}

export function getDropInterval(level = 1) {
  return Math.max(120, 1000 - (level - 1) * 90);
}
