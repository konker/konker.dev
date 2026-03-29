/* eslint-disable fp/no-this */
import { describe, expect, it, vi } from 'vitest';

import type { GameStorage } from '../application/ports/GameStorage';
import { GAME_METADATA_EMPTY } from '../domain/game/metadata';
import type { AppState } from '../domain/game/types';
import { createDefaultAppState, EMPTY_PERSISTED_SAVED_GAME_INDEX } from '../domain/game/types';
import { createGameEngine } from './index';

function createMemoryGameStorage(seedAppState = createDefaultAppState('2026-03-30T00:00:00.000Z')): GameStorage & {
  appState?: typeof seedAppState;
} {
  let appState = seedAppState;
  const games = new Map<string, typeof seedAppState.currentGame>();

  return {
    appState,
    async deleteGame(gameId) {
      games.delete(gameId);
    },
    async loadAppState() {
      return appState;
    },
    async loadGame(gameId) {
      return games.get(gameId);
    },
    async loadSavedGameIndex() {
      return EMPTY_PERSISTED_SAVED_GAME_INDEX;
    },
    async saveAppState(nextAppState) {
      appState = nextAppState;
      this.appState = nextAppState;
    },
    async saveGame(game) {
      games.set(game.id, game);
    },
  };
}

describe('createGameEngine persistence', () => {
  it('restores persisted app state during init', async () => {
    const storedAppState: AppState = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z'),
      currentGame: {
        ...createDefaultAppState('2026-03-30T00:00:00.000Z').currentGame,
        currentPly: 2,
        id: 'restored-game',
        metadata: {
          ...GAME_METADATA_EMPTY,
          event: 'Restored Event',
        },
        moveHistory: [
          { from: 'e2', san: 'e4', to: 'e4' },
          { from: 'e7', san: 'e5', to: 'e5' },
        ],
        orientation: 'black',
      },
    };
    const gameStorage = createMemoryGameStorage(storedAppState);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });

    expect(onUiStateChange).toHaveBeenCalled();
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      boardOrientation: 'black',
      currentPly: 2,
      gameMetadata: {
        event: 'Restored Event',
      },
      pgn: expect.stringContaining('1. e4 e5'),
    });
  });

  it('persists app state after moves and metadata changes', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({});
    await gameEngine.handleBoardMove('e4');
    gameEngine.setGameMetadata({
      ...GAME_METADATA_EMPTY,
      event: 'Saved Locally',
    });

    expect(gameStorage.appState?.currentGame.moveHistory).toEqual([{ from: 'e2', san: 'e4', to: 'e4' }]);
    expect(gameStorage.appState?.currentGame.metadata.event).toBe('Saved Locally');
  });
});
