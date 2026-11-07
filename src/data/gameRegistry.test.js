import { describe, it, expect } from 'vitest';
import { GAME_COMPONENTS, validateRegistry } from './gameRegistry';
import { PLAYABLE_GAMES } from './gamesData';

describe('gameRegistry', () => {
  it('every catalog game has a lazy component', () => {
    for (const game of PLAYABLE_GAMES) {
      expect(GAME_COMPONENTS[game.id], `missing component for ${game.id}`).toBeDefined();
    }
  });

  it('every registry entry has a catalog id', () => {
    const ids = PLAYABLE_GAMES.map(g => g.id);
    for (const id of Object.keys(GAME_COMPONENTS)) {
      expect(ids).toContain(id);
    }
  });

  it('validateRegistry reports ok', () => {
    const result = validateRegistry();
    expect(result.missingInRegistry).toEqual([]);
    expect(result.missingInCatalog).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
