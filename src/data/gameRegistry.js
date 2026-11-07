import { lazy } from 'react';
import { PLAYABLE_GAMES } from './gamesData';

/**
 * Single game registry: game id -> lazy component.
 * Every new game must be added here AND in gamesData.js
 * (PLAYABLE_GAMES) with a matching `id`. The explicit map below is required
 * because folder names do not always equal game ids
 * (e.g. directory `donut_tictactoe/` maps to id `tictactoe`).
 *
 * validateRegistry() is called in development and after each registry change
 * to surface a missing mapping immediately instead of a blank modal.
 */
export const GAME_COMPONENTS = {
  pacman: lazy(() => import('../components/games/pacman/PacManGame')),
  dino: lazy(() => import('../components/games/dino/DinoGame')),
  snake: lazy(() => import('../components/games/snake/SnakeGame')),
  solitaire: lazy(() => import('../components/games/solitaire/SolitaireGame')),
  minesweeper: lazy(() => import('../components/games/minesweeper/MinesweeperGame')),
  baseball: lazy(() => import('../components/games/baseball/BaseballGame')),
  gnome: lazy(() => import('../components/games/gnome/GnomeGame')),
  colortile: lazy(() => import('../components/games/colortile/ColorTileGame')),
  popcorn: lazy(() => import('../components/games/popcorn/PopcornGame')),
  tictactoe: lazy(() => import('../components/games/donut_tictactoe/DonutTicTacToeGame')),
  champion: lazy(() => import('../components/games/champion/ChampionGame')),
  cricket: lazy(() => import('../components/games/cricket/CricketGame')),
  ponyexpress: lazy(() => import('../components/games/ponyexpress/PonyExpressGame')),
  jerrylawson: lazy(() => import('../components/games/jerrylawson/JerryLawsonGame')),
  magic: lazy(() => import('../components/games/magic/MagicCatGame')),
  fruitmerge: lazy(() => import('../components/games/fruitmerge/FruitMergeGame')),
  brickbreaker: lazy(() => import('../components/games/brickbreaker/BrickBreakerGame')),
  skyjumper: lazy(() => import('../components/games/skyjumper/SkyJumperGame')),
  kidscoding: lazy(() => import('../components/games/kidscoding/KidsCodingGame')),
  bubbletea: lazy(() => import('../components/games/bubbletea/BubbleTeaGame')),
  pizza: lazy(() => import('../components/games/pizza/PizzaGame')),
  earthbee: lazy(() => import('../components/games/earthbee/EarthBeeGame')),
  olympics: lazy(() => import('../components/games/olympics/OlympicsGame')),
  pangolin: lazy(() => import('../components/games/pangolin/PangolinGame')),
  roswell: lazy(() => import('../components/games/roswell/RoswellGame')),
  petanque: lazy(() => import('../components/games/petanque/PetanqueGame')),
  halfmoon: lazy(() => import('../components/games/halfmoon/HalfMoonGame')),
  panipuri: lazy(() => import('../components/games/panipuri/PaniPuriGame')),
  memory: lazy(() => import('../components/games/memory/MemoryGame')),
  ghoulduel: lazy(() => import('../components/games/ghoulduel/GhoulDuelGame')),
  snowball: lazy(() => import('../components/games/snowball/SnowballGame')),
  schooltag: lazy(() => import('../components/games/schooltag/SchoolTagGame')),
  microkart: lazy(() => import('../components/games/microkart/MicroKartGame')),
  piratecoin: lazy(() => import('../components/games/piratecoin/PirateCoinGame')),
  tetris: lazy(() => import('../components/games/tetris/TetrisGame'))
};

export function validateRegistry() {
  const catalogIds = PLAYABLE_GAMES.map(g => g.id);
  const registryIds = Object.keys(GAME_COMPONENTS);

  const missingInRegistry = catalogIds.filter(id => !registryIds.includes(id));
  const missingInCatalog = registryIds.filter(id => !catalogIds.includes(id));

  const problems = [];
  if (missingInRegistry.length) problems.push(`catalog ids without a component: ${missingInRegistry.join(', ')}`);
  if (missingInCatalog.length) problems.push(`registry ids without a catalog entry: ${missingInCatalog.join(', ')}`);

  if (problems.length && import.meta.env.DEV) {
    console.warn('[gameRegistry] Mismatch detected —', problems.join('; '));
  }

  return { missingInRegistry, missingInCatalog, ok: problems.length === 0 };
}

export function getGameComponent(gameId) {
  return GAME_COMPONENTS[gameId] || null;
}
