import { beforeEach, describe, expect, it } from 'vitest';

import { GAME_METADATA_EMPTY } from '../../../domain/game/metadata';
import { createDefaultAppState } from '../../../domain/game/types';
import { createBrowserGameStorage } from './BrowserGameStorage';

describe('BrowserGameStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reloads the app state', async () => {
    const storage = createBrowserGameStorage();
    const appState = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z'),
      currentGame: {
        ...createDefaultAppState('2026-03-30T00:00:00.000Z').currentGame,
        currentPly: 1,
        id: 'game-1',
        moveHistory: [{ from: 'e2', san: 'e4', to: 'e4' }],
        updatedAt: '2026-03-30T00:01:00.000Z',
      },
    };

    await storage.saveAppState(appState);

    await expect(storage.loadAppState()).resolves.toEqual(appState);
  });

  it('saves games and maintains the saved-game index', async () => {
    const storage = createBrowserGameStorage();
    const game = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z').currentGame,
      id: 'saved-game-1',
      metadata: {
        ...GAME_METADATA_EMPTY,
        event: 'League Match',
        white: {
          ...GAME_METADATA_EMPTY.white,
          name: 'Alice',
        },
        black: {
          ...GAME_METADATA_EMPTY.black,
          name: 'Bob',
        },
      },
      moveHistory: [
        { from: 'e2', san: 'e4', to: 'e4' },
        { from: 'e7', san: 'e5', to: 'e5' },
      ],
      updatedAt: '2026-03-30T00:05:00.000Z',
    };

    await storage.saveGame(game);

    await expect(storage.loadGame(game.id)).resolves.toEqual(game);
    await expect(storage.loadSavedGameIndex()).resolves.toEqual({
      savedGames: [
        {
          black: 'Bob',
          createdAt: game.createdAt,
          event: 'League Match',
          id: game.id,
          moveCount: 2,
          updatedAt: game.updatedAt,
          white: 'Alice',
        },
      ],
      schemaVersion: 1,
    });

    await storage.deleteGame(game.id);

    await expect(storage.loadGame(game.id)).resolves.toBeUndefined();
    await expect(storage.loadSavedGameIndex()).resolves.toEqual({
      savedGames: [],
      schemaVersion: 1,
    });
  });
});
