/* eslint-disable fp/no-this */
import { describe, expect, it, vi } from 'vitest';

import type { ExternalOpen } from '../application/ports/ExternalOpen';
import type { FileExport } from '../application/ports/FileExport';
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

  it('exports and opens the selected saved game through injected adapters', async () => {
    const seedAppState = createDefaultAppState('2026-03-30T00:00:00.000Z');
    const gameStorage = createMemoryGameStorage(seedAppState);
    const fileExport: FileExport = {
      exportPgn: vi.fn(async () => undefined),
      exportScoreSheet: vi.fn(async () => undefined),
    };
    const externalOpen: ExternalOpen = {
      openChessDotCom: vi.fn(async () => undefined),
      openLichess: vi.fn(async () => undefined),
    };
    const savedGame = {
      ...seedAppState.currentGame,
      id: 'saved-game-1',
      metadata: {
        ...GAME_METADATA_EMPTY,
        black: {
          elo: '2000',
          name: 'Black Player',
        },
        event: 'League Match',
        white: {
          elo: '2100',
          name: 'White Player',
        },
      },
      moveHistory: [
        { from: 'e2', san: 'e4', to: 'e4' },
        { from: 'e7', san: 'e5', to: 'e5' },
      ],
    };

    await gameStorage.saveGame(savedGame);

    const gameEngine = createGameEngine({
      externalOpen,
      fileExport,
      gameStorage,
    });

    await gameEngine.init({});
    await gameEngine.exportGamePgn('saved-game-1');
    await gameEngine.exportGameScoreSheet('saved-game-1');
    await gameEngine.openGameInLichess('saved-game-1');
    await gameEngine.openGameInChessDotCom('saved-game-1');

    expect(fileExport.exportPgn).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'white-player-vs-black-player-2026-03-30.pgn',
        pgn: expect.stringContaining('[Event "League Match"]'),
      })
    );
    expect(fileExport.exportScoreSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'white-player-vs-black-player-2026-03-30-scoresheet.txt',
        format: 'txt',
      })
    );
    expect(externalOpen.openLichess).toHaveBeenCalledWith({
      pgn: expect.stringContaining('1. e4 e5'),
    });
    expect(externalOpen.openChessDotCom).toHaveBeenCalledWith({
      pgn: expect.stringContaining('1. e4 e5'),
    });
  });
});
