# Design Specification: Dochon Tetris (도촌 테트리스) Integration

**Date**: 2026-10-11  
**Project**: Dochon Games Portal (도촌초등학교 게임 포털)  
**Status**: Approved by User  

---

## 1. Objective & Requirements

Integrate the cloned game `tetris-for-everyone` (from `https://wbmaker01-ai.github.io/tetris-for-everyone/`) into Dochon Games Portal as a first-class native React game.
- **Game ID**: `tetris`
- **Korean Title**: `도촌 테트리스`
- **English Title**: `DOCHON TETRIS`
- **Category**: `클래식` (Classic)
- **Thumbnail**: `public/thumbnails/tetris.jpg` (Vibrant 3D arcade illustration)
- **Leaderboard Integration**: Real-time Firebase Cloud DB (`submitScoreToDB('tetris', name, score)`)
- **Portal Compliance Rules**:
  - Standalone directory: `src/components/games/tetris/` (전용 독립 폴더에서 일체 관리)
  - Score threshold: Only scores strictly greater than 100 (`score > 100`) can register to the leaderboard. Scores `<= 100` hide the input form.
  - Input placeholder: `'예: 홍길동'`.
  - Automatic leaderboard selection: On submission, call `onScoreSubmitted()` which opens `LeaderboardModal` with `activeTab="tetris"`.
  - Changelog update in `src/data/changelogData.js`: Educational-friendly terminology, no sensitive/secret credentials mentioned.

---

## 2. Architecture & File Structure

```
src/components/games/tetris/
├── TetrisGame.jsx               # Main React game component (Canvas, loop, controls, game over overlay)
├── tetrisConstants.js           # 7 tetromino matrix definitions, colors, scoring rules, drop speeds
├── tetrisSound.js               # Web Audio API Korobeiniki synthesized theme & sound FX manager
├── TetrisHowToPlayModal.jsx     # Controls & gameplay guide popup
└── tetris.css                   # Neon arcade responsive styles, mobile D-pad, HUD

src/data/gamesData.js            # Add 'tetris' to PLAYABLE_GAMES (releaseOrder: 35)
src/App.jsx                      # Register lazy-loaded TetrisGame component in GAME_COMPONENTS
src/data/changelogData.js        # Add release note entry dated 2026-10-11
public/thumbnails/tetris.jpg     # Dedicated 3D arcade thumbnail (1024x1024)
```

---

## 3. Detailed Component & Module Specifications

### 3.1 `tetrisConstants.js`
- **Matrix Definitions**:
  - `I`, `L`, `J`, `O`, `Z`, `S`, `T` 7 tetromino types with standard rotation pivots.
  - Color mapping matching neon arcade theme.
- **Board Configuration**:
  - Width: 12 columns, Height: 20 rows.
  - Canvas scaling: 30px per block on standard resolution.
- **Scoring Formulas**:
  - Single line: 10 points
  - Double line: 40 points
  - Triple line: 90 points
  - Tetris (4 lines): 160 points
  - Combo multiplier: `linesCleared * 10 * linesCleared * (comboCount > 1 ? comboCount : 1)`
  - Level formula: `Math.floor(score / 100) + 1`
  - Drop speed: `Math.max(120, 1000 - (level - 1) * 90)` ms.

### 3.2 `tetrisSound.js`
- Pure Web Audio API synthesis (zero external audio file dependencies for 100% offline & school network reliability):
  - **BGM**: Square-wave synthesized 8-bit Korobeiniki melody with envelope shaping to prevent clicking.
  - **SFX**:
    - `move`: Triangle wave short frequency modulation.
    - `rotate`: Rapid pitch shift blip.
    - `drop`: Low punch frequency drop.
    - `clear`: Multi-tone chime scaled by line count (single, double, triple, tetris).
    - `gameover`: Descending retro tone sequence.
  - Synchronizes with global portal sound mute settings.

### 3.3 `TetrisGame.jsx`
- **State Management**:
  - `gameState`: `'ready'`, `'playing'`, `'paused'`, `'gameover'`
  - `score`, `level`, `linesClearedTotal`, `comboCount`
  - `currentPiece`, `nextPiece`, `ghostPiece` (pre-calculated landing position)
  - `isMuted`, `isHowToPlayOpen`
  - Leaderboard form state: `playerName`, `isSubmitting`, `isSubmitted`
- **Controls**:
  - Keyboard: `ArrowLeft`, `ArrowRight`, `ArrowUp` (Rotate), `ArrowDown` (Soft Drop), `Space` (Hard Drop).
  - Mobile Touch Controls: On-screen buttons with haptic feedback & touch prevention.
- **Visual Effects**:
  - Ghost piece rendering with semi-transparent dashed/glow outline.
  - Canvas floating text animation for combos & clears (`SINGLE!`, `DOUBLE!`, `TRIPLE!`, `TETRIS!!`).
  - Horizontal line clear flash animation before rows shift down.
- **Game Over & Leaderboard UI**:
  - Summary stats: Final Score, Max Level, Total Cleared Lines.
  - Score registration form:
    - Visible ONLY when `score > 100`.
    - Input placeholder: `'예: 홍길동'`.
    - Submits to `submitScoreToDB('tetris', playerName.trim(), score)`.
    - On submission, calls `onScoreSubmitted()` prop to trigger portal leaderboard modal.
  - Retry button to immediately start a new game.

### 3.4 `TetrisHowToPlayModal.jsx`
- Clean modal detailing rules, keyboard shortcuts, mobile controls, and high-score tips.

---

## 4. Verification & Testing Strategy
- Unit & static checks: Code syntax verification and build tests (`npm run build`).
- Functional test in browser:
  - Game startup, block movements, rotation wall-kicks, collision detection.
  - Line clears, scoring, level-up speed increase.
  - Audio playback and mute toggling.
  - Score `<= 100`: verify input is hidden.
  - Score `> 100`: test score submission, verify Cloud DB update, verify automatic leaderboard modal tab switch.
  - Verify changelog modal shows 2026-10-11 release note.
