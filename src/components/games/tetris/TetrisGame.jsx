import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';

import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BLOCK_SIZE,
  PREVIEW_SIZE,
  COLORS,
  PIECES,
  PIECE_KEYS,
  calculateScore,
  getDropInterval,
} from './tetrisConstants';
import { tetrisSound } from './tetrisSound';
import TetrisHowToPlayModal from './TetrisHowToPlayModal';
import { haptics } from '../../../utils/haptics';
import ScoreSubmitForm from '../../../components/ScoreSubmitForm';
import { useScoreSubmit } from '../../../hooks/useScoreSubmit';
import { useGlobalMuted } from '../../../components/AudioProvider';
import './tetris.css';

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

function rotateClockwise(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

function createBag() {
  const keys = [...PIECE_KEYS];
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys;
}

function spawnPiece(pieceKey) {
  const matrix = PIECES[pieceKey].map((row) => [...row]);
  const width = matrix[0].length;
  return {
    key: pieceKey,
    matrix,
    x: Math.floor((BOARD_WIDTH - width) / 2),
    y: 0,
  };
}

function checkCollision(board, pieceMatrix, posX, posY) {
  for (let r = 0; r < pieceMatrix.length; r++) {
    for (let c = 0; c < pieceMatrix[r].length; c++) {
      if (pieceMatrix[r][c] !== 0) {
        const x = posX + c;
        const y = posY + r;
        if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
          return true;
        }
        if (y >= 0 && board[y] && board[y][x] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function getGhostY(board, piece) {
  if (!piece) return 0;
  let gY = piece.y;
  while (!checkCollision(board, piece.matrix, piece.x, gY + 1)) {
    gY++;
  }
  return gY;
}

function drawBlock(ctx, x, y, size, color, isActive = false) {
  ctx.save();
  if (isActive) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
  }

  // Base fill
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

  // Top highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.fillRect(x + 2, y + 2, size - 4, 3);
  // Left highlight
  ctx.fillRect(x + 2, y + 2, 3, size - 4);

  // Bottom shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(x + 2, y + size - 5, size - 4, 3);
  // Right shadow
  ctx.fillRect(x + size - 5, y + 2, 3, size - 4);

  // Inner subtle box
  if (size >= 16) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
  }

  ctx.restore();
}

function drawPreview(canvas, piece) {
  if (!canvas || !piece) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const matrix = piece.matrix;
  const rows = matrix.length;
  const cols = matrix[0].length;
  const blockSize = Math.min(
    20,
    Math.floor((canvas.width - 12) / cols),
    Math.floor((canvas.height - 12) / rows)
  );

  const startX = Math.floor((canvas.width - cols * blockSize) / 2);
  const startY = Math.floor((canvas.height - rows * blockSize) / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = matrix[r][c];
      if (val !== 0) {
        drawBlock(ctx, startX + c * blockSize, startY + r * blockSize, blockSize, COLORS[val]);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Main TetrisGame Component
// -----------------------------------------------------------------------------

export default function TetrisGame({ onScoreSubmitted }) {
  // Game state
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'paused', 'gameover'
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const { muted: globalMuted, toggleMute: toggleGlobalMute } = useGlobalMuted();
  const [isMuted, setIsMuted] = useState(() => globalMuted ?? false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Sync global mute into tetris's own theme engine (setMuted stops the theme)
  useEffect(() => {
    tetrisSound.setMuted(globalMuted ?? false);
  }, [globalMuted]);

  // Leaderboard Form State (shared hook)
  const scoreSubmit = useScoreSubmit({ gameKey: 'tetris', score, onSubmitted: onScoreSubmitted });

  // Canvas Refs
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const mobilePreviewCanvasRef = useRef(null);

  // Logic Refs (for 60fps loop & event handlers to prevent stale closure)
  const bagRef = useRef([]);
  const gameStateRef = useRef(gameState);
  const boardRef = useRef(board);
  const currentPieceRef = useRef(currentPiece);
  const nextPieceRef = useRef(nextPiece);
  const scoreRef = useRef(score);
  const levelRef = useRef(level);
  const linesRef = useRef(linesClearedTotal);
  const comboRef = useRef(comboCount);
  const maxComboRef = useRef(maxCombo);

  // Visual FX Refs
  const flashesRef = useRef([]); // [{ rows: number[], startTime: number, duration: number }]
  const floatingTextsRef = useRef([]); // [{ id, text, x, y, color, startTime, duration }]

  // Synchronize state to refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentPieceRef.current = currentPiece; }, [currentPiece]);
  useEffect(() => { nextPieceRef.current = nextPiece; }, [nextPiece]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { linesRef.current = linesClearedTotal; }, [linesClearedTotal]);
  useEffect(() => { comboRef.current = comboCount; }, [comboCount]);
  useEffect(() => { maxComboRef.current = maxCombo; }, [maxCombo]);

  // Haptic Feedback Helpers
  const triggerLightHaptic = () => {
    try {
      if (typeof haptics.light === 'function') haptics.light();
    } catch (e) {}
  };

  const triggerImpactHaptic = () => {
    try {
      if (typeof haptics.impactMedium === 'function') {
        haptics.impactMedium();
      } else if (typeof haptics.medium === 'function') {
        haptics.medium();
      }
    } catch (e) {}
  };

  const triggerSuccessHaptic = () => {
    try {
      if (typeof haptics.success === 'function') haptics.success();
    } catch (e) {}
  };

  const triggerWarningHaptic = () => {
    try {
      if (typeof haptics.warning === 'function') haptics.warning();
    } catch (e) {}
  };

  // Floating text creator
  const addFloatingText = (text, color = '#FDE047') => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x: (BOARD_WIDTH * BLOCK_SIZE) / 2,
      y: (BOARD_HEIGHT * BLOCK_SIZE) / 2 - 20,
      color,
      startTime: performance.now(),
      duration: 1000,
    });
  };

  // ---------------------------------------------------------------------------
  // Canvas Rendering Function
  // ---------------------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const currentB = boardRef.current;
    const currentP = currentPieceRef.current;
    const ghostY = currentP ? getGhostY(currentB, currentP) : 0;

    // 1. Clear background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE, 0);
      ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK_SIZE);
      ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.stroke();
    }

    // 3. Draw locked blocks on board
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const val = currentB[y][x];
        if (val !== 0) {
          drawBlock(ctx, x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, COLORS[val]);
        }
      }
    }

    // 4. Draw Ghost Piece (semi-transparent outline & subtle glow)
    if (currentP && ghostY !== currentP.y && (gameStateRef.current === 'playing' || gameStateRef.current === 'paused')) {
      const pieceKey = currentP.key;
      let pieceVal = 1;
      for (const row of currentP.matrix) {
        const found = row.find((v) => v !== 0);
        if (found) {
          pieceVal = found;
          break;
        }
      }
      const ghostColor = COLORS[pieceVal] || '#38BDF8';

      for (let r = 0; r < currentP.matrix.length; r++) {
        for (let c = 0; c < currentP.matrix[r].length; c++) {
          if (currentP.matrix[r][c] !== 0) {
            const gx = (currentP.x + c) * BLOCK_SIZE;
            const gy = (ghostY + r) * BLOCK_SIZE;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
            ctx.strokeStyle = ghostColor;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
            ctx.restore();
          }
        }
      }
    }

    // 5. Draw Active Tetromino Piece
    if (currentP) {
      for (let r = 0; r < currentP.matrix.length; r++) {
        for (let c = 0; c < currentP.matrix[r].length; c++) {
          const val = currentP.matrix[r][c];
          if (val !== 0) {
            const px = (currentP.x + c) * BLOCK_SIZE;
            const py = (currentP.y + r) * BLOCK_SIZE;
            drawBlock(ctx, px, py, BLOCK_SIZE, COLORS[val], true);
          }
        }
      }
    }

    // 6. Draw Line Clear Flash Animation
    const now = performance.now();
    flashesRef.current = flashesRef.current.filter((flash) => {
      const elapsed = now - flash.startTime;
      if (elapsed >= flash.duration) return false;
      const alpha = 1 - elapsed / flash.duration;
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 18;
      flash.rows.forEach((rowY) => {
        ctx.fillRect(0, rowY * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
      });
      ctx.restore();
      return true;
    });

    // 7. Draw Floating Combo / Clear Text Animation
    floatingTextsRef.current = floatingTextsRef.current.filter((item) => {
      const elapsed = now - item.startTime;
      if (elapsed >= item.duration) return false;
      const progress = elapsed / item.duration;
      const currentY = item.y - progress * 40;
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '900 24px Pretendard, -apple-system, sans-serif';
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 16;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.text, item.x, currentY);
      ctx.restore();
      return true;
    });
  }, []);

  // Dedicated effect for Next Piece preview canvases (only redraws when nextPiece updates)
  useEffect(() => {
    if (previewCanvasRef.current && nextPiece) {
      drawPreview(previewCanvasRef.current, nextPiece);
    }
    if (mobilePreviewCanvasRef.current && nextPiece) {
      drawPreview(mobilePreviewCanvasRef.current, nextPiece);
    }
  }, [nextPiece]);

  // ---------------------------------------------------------------------------
  // Piece Lock & Spawn Logic
  // ---------------------------------------------------------------------------
  const lockAndSpawn = useCallback(() => {
    const currentP = currentPieceRef.current;
    const currentB = boardRef.current;
    if (!currentP) return;

    // 1. Lock current piece into board
    const newBoard = currentB.map((r) => [...r]);
    for (let r = 0; r < currentP.matrix.length; r++) {
      for (let c = 0; c < currentP.matrix[r].length; c++) {
        const val = currentP.matrix[r][c];
        if (val !== 0) {
          const by = currentP.y + r;
          const bx = currentP.x + c;
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            newBoard[by][bx] = val;
          }
        }
      }
    }

    // 2. Check completed lines
    const clearedRows = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (newBoard[y].every((cell) => cell !== 0)) {
        clearedRows.push(y);
      }
    }

    let newScore = scoreRef.current;
    let newLines = linesRef.current;
    let newCombo = comboRef.current;
    let newLevel = levelRef.current;
    let newMaxCombo = maxComboRef.current;

    if (clearedRows.length > 0) {
      const numLines = clearedRows.length;
      newCombo = newCombo + 1;
      newLines = newLines + numLines;
      const addedScore = calculateScore(numLines, newCombo);
      newScore = newScore + addedScore;
      newLevel = Math.max(1, Math.floor(newScore / 100) + 1);
      newMaxCombo = Math.max(newMaxCombo, newCombo);

      // Register flash effect
      flashesRef.current.push({
        rows: clearedRows,
        startTime: performance.now(),
        duration: 220,
      });

      // Sound & Haptics
      tetrisSound.playSFX('clear', numLines);
      triggerSuccessHaptic();

      // Floating Clear & Combo Text FX
      if (numLines === 1) addFloatingText('SINGLE!', '#38BDF8');
      else if (numLines === 2) addFloatingText('DOUBLE!', '#60A5FA');
      else if (numLines === 3) addFloatingText('TRIPLE!', '#C084FC');
      else if (numLines >= 4) addFloatingText('TETRIS!!', '#FBBF24');

      if (newCombo > 1) {
        setTimeout(() => {
          addFloatingText(`COMBO x${newCombo}!`, '#F97316');
        }, 160);
      }

      // Remove cleared rows and insert empty rows at top
      const remainingRows = newBoard.filter((_, idx) => !clearedRows.includes(idx));
      const emptyRows = Array.from({ length: numLines }, () => Array(BOARD_WIDTH).fill(0));
      const updatedBoard = [...emptyRows, ...remainingRows];

      boardRef.current = updatedBoard;
      setBoard(updatedBoard);
    } else {
      newCombo = 0;
      tetrisSound.playSFX('drop');
      boardRef.current = newBoard;
      setBoard(newBoard);
    }

    scoreRef.current = newScore;
    setScore(newScore);
    linesRef.current = newLines;
    setLinesClearedTotal(newLines);
    comboRef.current = newCombo;
    setComboCount(newCombo);
    levelRef.current = newLevel;
    setLevel(newLevel);
    maxComboRef.current = newMaxCombo;
    setMaxCombo(newMaxCombo);

    // 3. Spawn Next Tetromino
    let bag = bagRef.current;
    if (!bag || bag.length === 0) {
      bag = createBag();
      bagRef.current = bag;
    }
    const nextPieceKey = bag.pop();
    const incomingNext = spawnPiece(nextPieceKey);
    const nextActive = nextPieceRef.current;

    // 4. Check Game Over on spawn
    if (checkCollision(boardRef.current, nextActive.matrix, nextActive.x, nextActive.y)) {
      currentPieceRef.current = null;
      setCurrentPiece(null);
      gameStateRef.current = 'gameover';
      setGameState('gameover');
      tetrisSound.stopTheme();
      tetrisSound.playSFX('gameover');
      triggerWarningHaptic();
      return;
    }

    currentPieceRef.current = nextActive;
    setCurrentPiece(nextActive);

    nextPieceRef.current = incomingNext;
    setNextPiece(incomingNext);
  }, []);

  // Soft Drop Tick
  const tickDrop = useCallback(() => {
    const currentP = currentPieceRef.current;
    const currentB = boardRef.current;
    if (!currentP || gameStateRef.current !== 'playing') return;

    if (!checkCollision(currentB, currentP.matrix, currentP.x, currentP.y + 1)) {
      const moved = { ...currentP, y: currentP.y + 1 };
      currentPieceRef.current = moved;
      setCurrentPiece(moved);
    } else {
      lockAndSpawn();
    }
  }, [lockAndSpawn]);

  // ---------------------------------------------------------------------------
  // Player Controls (Left, Right, Rotate, Soft Drop, Hard Drop, Pause)
  // ---------------------------------------------------------------------------
  const handleMoveLeft = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const currentP = currentPieceRef.current;
    const currentB = boardRef.current;
    if (!currentP) return;

    if (!checkCollision(currentB, currentP.matrix, currentP.x - 1, currentP.y)) {
      const moved = { ...currentP, x: currentP.x - 1 };
      currentPieceRef.current = moved;
      setCurrentPiece(moved);
      tetrisSound.playSFX('move');
      triggerLightHaptic();
      renderCanvas();
    }
  }, [renderCanvas]);

  const handleMoveRight = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const currentP = currentPieceRef.current;
    const currentB = boardRef.current;
    if (!currentP) return;

    if (!checkCollision(currentB, currentP.matrix, currentP.x + 1, currentP.y)) {
      const moved = { ...currentP, x: currentP.x + 1 };
      currentPieceRef.current = moved;
      setCurrentPiece(moved);
      tetrisSound.playSFX('move');
      triggerLightHaptic();
      renderCanvas();
    }
  }, [renderCanvas]);

  const handleRotate = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const currentP = currentPieceRef.current;
    const currentB = boardRef.current;
    if (!currentP) return;

    const rotatedMatrix = rotateClockwise(currentP.matrix);
    const kickOffsets = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
    ];

    for (const [dx, dy] of kickOffsets) {
      if (!checkCollision(currentB, rotatedMatrix, currentP.x + dx, currentP.y + dy)) {
        const rotated = {
          ...currentP,
          matrix: rotatedMatrix,
          x: currentP.x + dx,
          y: currentP.y + dy,
        };
        currentPieceRef.current = rotated;
        setCurrentPiece(rotated);
        tetrisSound.playSFX('rotate');
        triggerLightHaptic();
        renderCanvas();
        return;
      }
    }
  }, [renderCanvas]);

  const handleSoftDrop = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const currentP = currentPieceRef.current;
    const currentB = boardRef.current;
    if (!currentP) return;

    if (!checkCollision(currentB, currentP.matrix, currentP.x, currentP.y + 1)) {
      const moved = { ...currentP, y: currentP.y + 1 };
      currentPieceRef.current = moved;
      setCurrentPiece(moved);
      tetrisSound.playSFX('move');
      triggerLightHaptic();
      renderCanvas();
    } else {
      lockAndSpawn();
    }
  }, [lockAndSpawn, renderCanvas]);

  const handleHardDrop = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const currentP = currentPieceRef.current;
    const currentB = boardRef.current;
    if (!currentP) return;

    const ghostY = getGhostY(currentB, currentP);
    const dropped = { ...currentP, y: ghostY };
    currentPieceRef.current = dropped;
    setCurrentPiece(dropped);

    triggerImpactHaptic();

    lockAndSpawn();
  }, [lockAndSpawn]);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      gameStateRef.current = 'paused';
      setGameState('paused');
      tetrisSound.stopTheme();
    } else if (gameStateRef.current === 'paused') {
      gameStateRef.current = 'playing';
      setGameState('playing');
      if (!isMuted) {
        tetrisSound.playTheme();
      }
    }
  }, [isMuted]);

  // Start / Restart Game
  const startGame = useCallback(() => {
    const newBoard = createEmptyBoard();
    boardRef.current = newBoard;
    setBoard(newBoard);

    const bag = createBag();
    const firstKey = bag.pop();
    const secondKey = bag.pop();
    bagRef.current = bag;

    const firstPiece = spawnPiece(firstKey);
    const secondPiece = spawnPiece(secondKey);

    currentPieceRef.current = firstPiece;
    setCurrentPiece(firstPiece);

    nextPieceRef.current = secondPiece;
    setNextPiece(secondPiece);

    scoreRef.current = 0;
    setScore(0);
    levelRef.current = 1;
    setLevel(1);
    linesRef.current = 0;
    setLinesClearedTotal(0);
    comboRef.current = 0;
    setComboCount(0);
    maxComboRef.current = 0;
    setMaxCombo(0);

    flashesRef.current = [];
    floatingTextsRef.current = [];

    scoreSubmit.resetSubmitState();

    gameStateRef.current = 'playing';
    setGameState('playing');

    if (!isMuted) {
      tetrisSound.playTheme();
    }
  }, [isMuted]);

  const handleRestart = () => {
    startGame();
  };

  // Sound Toggle Handler (synced with portal-wide AudioProvider)
  const toggleSound = () => {
    const nextMuted = toggleGlobalMute();
    setIsMuted(nextMuted);
    if (!nextMuted && gameStateRef.current === 'playing') {
      tetrisSound.playTheme();
    }
  };

  // Help Modal Toggle
  const handleOpenHowToPlay = () => {
    if (gameStateRef.current === 'playing') {
      gameStateRef.current = 'paused';
      setGameState('paused');
      tetrisSound.stopTheme();
    }
    setIsHowToPlayOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Keyboard Listeners
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      // Don't intercept when user is typing in form inputs
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isHowToPlayOpen) {
          setIsHowToPlayOpen(false);
          return;
        }
        togglePause();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (gameStateRef.current !== 'playing') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleMoveLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleMoveRight();
      } else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && !e.repeat) {
        e.preventDefault();
        handleRotate();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSoftDrop();
      } else if ((e.code === 'Space' || e.key === ' ') && !e.repeat) {
        e.preventDefault();
        handleHardDrop();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMoveLeft, handleMoveRight, handleRotate, handleSoftDrop, handleHardDrop, togglePause, isHowToPlayOpen]);

  // ---------------------------------------------------------------------------
  // 60FPS Game Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== 'playing') {
      renderCanvas();
      return;
    }

    let lastDropTime = performance.now();
    let animId;

    const loop = (currentTime) => {
      const currentLvl = levelRef.current;
      const interval = getDropInterval(currentLvl);

      if (currentTime - lastDropTime >= interval) {
        lastDropTime = currentTime;
        tickDrop();
      }

      renderCanvas();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [gameState, tickDrop, renderCanvas]);

  // Theme audio cleanup on unmount
  useEffect(() => {
    return () => {
      tetrisSound.stopTheme();
    };
  }, []);

  return (
    <div className="tetris-container">
      <div className="tetris-game-wrapper">
        {/* 1. Top HUD Bar */}
        <div className="tetris-hud-bar">
          <div className="tetris-hud-left">
            <div className="tetris-hud-logo">🧱</div>
            <div className="tetris-hud-titles">
              <h1 className="tetris-hud-title">도촌 테트리스</h1>
              <span className="tetris-hud-subtitle">DOCHON TETRIS ARCADE</span>
            </div>
          </div>
          <div className="tetris-hud-actions">
            <button
              type="button"
              className="tetris-hud-btn"
              onClick={toggleSound}
              title={isMuted ? '음소거 해제' : '음소거'}
              aria-label={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? (
                <VolumeX style={{ width: '18px', height: '18px', color: '#F87171' }} />
              ) : (
                <Volume2 style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
              )}
            </button>
            <button
              type="button"
              className="tetris-hud-btn"
              onClick={handleOpenHowToPlay}
              title="게임 방법 설명"
              aria-label="게임 방법 설명"
            >
              <HelpCircle style={{ width: '18px', height: '18px', color: '#FBBF24' }} />
            </button>
            {gameState === 'playing' && (
              <button
                type="button"
                className="tetris-hud-btn"
                onClick={togglePause}
                title="일시 정지 (P)"
                aria-label="일시 정지"
              >
                <Pause style={{ width: '18px', height: '18px', color: '#A855F7' }} />
              </button>
            )}
            {gameState === 'paused' && (
              <button
                type="button"
                className="tetris-hud-btn"
                onClick={togglePause}
                title="게임 재개 (P)"
                aria-label="게임 재개"
              >
                <Play style={{ width: '18px', height: '18px', color: '#22C55E' }} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Mobile HUD (Visible on Small Screens) */}
        <div className="tetris-mobile-hud">
          <div className="tetris-mobile-stat-card">
            <span className="tetris-mobile-stat-label">SCORE</span>
            <span className="tetris-mobile-stat-value tetris-score-val">{score.toLocaleString()}</span>
          </div>
          <div className="tetris-mobile-stat-card">
            <span className="tetris-mobile-stat-label">LEVEL</span>
            <span className="tetris-mobile-stat-value tetris-level-val">{level}</span>
          </div>
          <div className="tetris-mobile-stat-card">
            <span className="tetris-mobile-stat-label">LINES</span>
            <span className="tetris-mobile-stat-value tetris-lines-val">{linesClearedTotal}</span>
          </div>
          <div className="tetris-mobile-stat-card">
            <span className="tetris-mobile-stat-label">NEXT</span>
            <canvas
              ref={mobilePreviewCanvasRef}
              width={40}
              height={40}
              style={{ display: 'block', margin: '2px auto 0' }}
            />
          </div>
        </div>

        {/* 3. Main Gameplay Area (Board + Desktop Sidebar) */}
        <div className="tetris-main-layout">
          {/* Board Wrapper */}
          <div className="tetris-board-wrapper">
            <canvas
              ref={canvasRef}
              width={BOARD_WIDTH * BLOCK_SIZE}
              height={BOARD_HEIGHT * BLOCK_SIZE}
              className="tetris-canvas"
            />

            {/* Ready Overlay */}
            {gameState === 'ready' && (
              <div className="tetris-pause-overlay">
                <span style={{ fontSize: '48px', marginBottom: '4px' }}>🧱</span>
                <h2 className="tetris-pause-title">도촌 테트리스</h2>
                <p
                  style={{
                    color: '#94A3B8',
                    fontSize: '13px',
                    margin: '0 0 16px',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  네온 아케이드 블록 퍼즐!<br />
                  블록을 채워 라인을 삭제하고 콤보를 노리세요.
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className="tetris-restart-btn"
                  style={{ maxWidth: '200px' }}
                >
                  <Play style={{ width: '18px', height: '18px' }} />
                  <span>게임 시작 🚀</span>
                </button>
              </div>
            )}

            {/* Pause Overlay */}
            {gameState === 'paused' && (
              <div className="tetris-pause-overlay">
                <h2 className="tetris-pause-title">PAUSED</h2>
                <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 16px' }}>
                  게임이 일시 정지되었습니다.
                </p>
                <button
                  type="button"
                  onClick={togglePause}
                  className="tetris-restart-btn"
                  style={{ maxWidth: '180px' }}
                >
                  <Play style={{ width: '16px', height: '16px' }} />
                  <span>계속하기 ▶</span>
                </button>
              </div>
            )}

            {/* Game Over Modal Overlay */}
            {gameState === 'gameover' && (
              <div className="tetris-overlay-modal">
                <div className="tetris-gameover-card">
                  <h2 className="tetris-gameover-title">GAME OVER</h2>
                  <p className="tetris-gameover-subtitle">블록이 천장에 도달했습니다!</p>

                  {/* Summary Stats Pill Grid */}
                  <div className="tetris-gameover-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="tetris-stat-pill">
                      <span className="tetris-pill-label">최종 점수</span>
                      <span className="tetris-pill-value score">{score.toLocaleString()}</span>
                    </div>
                    <div className="tetris-stat-pill">
                      <span className="tetris-pill-label">클리어</span>
                      <span className="tetris-pill-value">{linesClearedTotal}줄</span>
                    </div>
                    <div className="tetris-stat-pill">
                      <span className="tetris-pill-label">레벨</span>
                      <span className="tetris-pill-value">{level}</span>
                    </div>
                    <div className="tetris-stat-pill">
                      <span className="tetris-pill-label">최대콤보</span>
                      <span className="tetris-pill-value">{maxCombo}회</span>
                    </div>
                  </div>

                  {/* 100점 이하 점수 등록 차단 원칙 (CRITICAL) */}
                  {score <= 100 ? (
                    <div
                      className="tetris-hof-form"
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        color: '#FCA5A5',
                        padding: '12px 14px',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        textAlign: 'center',
                      }}
                    >
                      ⚠️ 명예의 전당 등록은 100점 초과 달성 시에만 가능합니다. (현재: {score}점)
                    </div>
                  ) : (
                    <ScoreSubmitForm
                      score={score}
                      submitState={scoreSubmit}
                      formClassName="tetris-hof-form"
                      inputClassName="tetris-hof-input"
                      buttonClassName="tetris-hof-btn"
                      successClassName="tetris-hof-success"
                      successText="명예의 전당에 성공적으로 등록되었습니다! 🏆"
                      titleNode={<div className="tetris-hof-title"><span>도촌초 명예의 전당 등록</span></div>}
                      noticeText="이름(또는 닉네임)을 입력하고 실시간 랭킹에 도전하세요!"
                    />
                  )}

                  {/* Restart Button */}
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="tetris-restart-btn"
                  >
                    <RotateCcw style={{ width: '16px', height: '16px' }} />
                    <span>다시 도전하기</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className="tetris-sidebar">
            <div className="tetris-info-card">
              <div className="tetris-card-title">NEXT PIECE</div>
              <canvas
                ref={previewCanvasRef}
                width={100}
                height={100}
                className="tetris-preview-canvas"
              />
            </div>

            <div className="tetris-info-card">
              <div className="tetris-stat-box">
                <div className="tetris-stat-item">
                  <span className="tetris-stat-label">SCORE</span>
                  <span className="tetris-stat-value tetris-score-val">{score.toLocaleString()}</span>
                </div>
                <div className="tetris-stat-item">
                  <span className="tetris-stat-label">LEVEL</span>
                  <span className="tetris-stat-value tetris-level-val">{level}</span>
                </div>
                <div className="tetris-stat-item">
                  <span className="tetris-stat-label">LINES</span>
                  <span className="tetris-stat-value tetris-lines-val">{linesClearedTotal}</span>
                </div>
                {comboCount > 1 && (
                  <div className="tetris-combo-badge">
                    <span>🔥 {comboCount} COMBO!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Mobile On-Screen Touch Controls */}
        <div className="tetris-touch-controls">
          <div className="tetris-touch-cluster tetris-dpad-cluster">
            <button
              type="button"
              className="tetris-touch-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                handleMoveLeft();
              }}
              aria-label="왼쪽 이동"
            >
              <span style={{ fontSize: '18px' }}>◀</span>
              <span className="tetris-touch-label">좌</span>
            </button>
            <button
              type="button"
              className="tetris-touch-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                handleMoveRight();
              }}
              aria-label="오른쪽 이동"
            >
              <span style={{ fontSize: '18px' }}>▶</span>
              <span className="tetris-touch-label">우</span>
            </button>
            <button
              type="button"
              className="tetris-touch-btn btn-drop"
              onPointerDown={(e) => {
                e.preventDefault();
                handleSoftDrop();
              }}
              aria-label="소프트 드롭"
            >
              <span style={{ fontSize: '18px' }}>▼</span>
              <span className="tetris-touch-label">소프트</span>
            </button>
          </div>

          <div className="tetris-touch-cluster tetris-action-cluster">
            <button
              type="button"
              className="tetris-touch-btn btn-rotate"
              onPointerDown={(e) => {
                e.preventDefault();
                handleRotate();
              }}
              aria-label="회전"
            >
              <span style={{ fontSize: '18px' }}>↻</span>
              <span className="tetris-touch-label">회전</span>
            </button>
            <button
              type="button"
              className="tetris-touch-btn btn-hard-drop"
              onPointerDown={(e) => {
                e.preventDefault();
                handleHardDrop();
              }}
              aria-label="하드 드롭"
            >
              <span style={{ fontSize: '18px' }}>⤓</span>
              <span className="tetris-touch-label">하드드롭</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. How To Play Modal */}
      <TetrisHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
