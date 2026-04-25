/* eslint-disable fp/no-this,fp/no-loops */
import { describe, expect, it, vi } from 'vitest';

import type { ExternalOpen } from '../application/ports/ExternalOpen';
import type { FileExport } from '../application/ports/FileExport';
import type { GameStorage } from '../application/ports/GameStorage';
import { GAME_METADATA_EMPTY } from '../domain/game/metadata';
import type { AppState } from '../domain/game/types';
import { createDefaultAppState } from '../domain/game/types';

vi.mock('../audio-output', () => ({
  audioOutputIsSupported: () => true,
  boardAdapterUpdateMovedSoundsInvalid: vi.fn(),
  boardAdapterUpdateMovedSoundsOk: vi.fn(),
  exitAudioOutput: vi.fn(),
  initAudioOutput: vi.fn(async () => ({
    audioBufferMap: {},
    audioContext: {},
    audioOutputEventSoundMap: {},
    isUnlocked: false,
  })),
  unlockAudioOutput: vi.fn(async () => undefined),
}));

import { createGameEngine } from './index';

function createMemoryGameStorage(seedAppState = createDefaultAppState('2026-03-30T00:00:00.000Z')): GameStorage & {
  appState?: typeof seedAppState;
  deletedGameIds: Array<string>;
} {
  let appState = seedAppState;
  const games = new Map<string, typeof seedAppState.currentGame>();
  const deletedGameIds: Array<string> = [];

  return {
    appState,
    deletedGameIds,
    async deleteGame(gameId) {
      deletedGameIds.push(gameId);
      games.delete(gameId);
    },
    async loadAppState() {
      return appState;
    },
    async loadGame(gameId) {
      return games.get(gameId);
    },
    async loadSavedGameIndex() {
      return {
        savedGames: Array.from(games.values()).map((game) => ({
          black: game.metadata.black.name,
          createdAt: game.createdAt,
          date: game.metadata.date,
          event: game.metadata.event,
          id: game.id,
          moveCount: game.moveHistory.length,
          updatedAt: game.updatedAt,
          white: game.metadata.white.name,
        })),
        schemaVersion: 1,
      };
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
      legalMovesSan: expect.arrayContaining(['Nf3', 'Nc3', 'Bb5', 'Bc4', 'd4']),
      lastInputEvaluateStatus: 'ok',
      lastInputResultMessage: 'e5',
      lastMoveColor: 'black',
      lastMovePiece: 'pawn',
      lastMoveSan: 'e5',
      pgn: expect.stringContaining('[Orientation "black"]'),
    });
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      pgn: expect.stringContaining('1. e4 e5'),
    });
  });

  it('always starts with audio output off even when persisted state had it enabled', async () => {
    const storedAppState: AppState = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z'),
      settings: {
        audioInputEnabled: false,
        audioOutputEnabled: true,
      },
    };
    const gameStorage = createMemoryGameStorage(storedAppState);
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({});

    expect(gameEngine.isAudioOutputOn()).toBe(false);
    expect(gameStorage.appState?.settings.audioOutputEnabled).toBe(false);
  });

  it('restores a past position as neutral when current ply is behind the last move', async () => {
    const storedAppState: AppState = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z'),
      currentGame: {
        ...createDefaultAppState('2026-03-30T00:00:00.000Z').currentGame,
        currentPly: 1,
        id: 'restored-past-position',
        moveHistory: [
          { from: 'e2', san: 'e4', to: 'e4' },
          { from: 'e7', san: 'e5', to: 'e5' },
        ],
      },
    };
    const gameStorage = createMemoryGameStorage(storedAppState);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });

    expect(onUiStateChange).toHaveBeenCalled();
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 1,
      lastInputEvaluateStatus: 'ignore',
      lastInputResultMessage: 'Viewing past move',
      lastMoveSan: 'e4',
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
    await expect(gameStorage.loadSavedGameIndex()).resolves.toMatchObject({
      savedGames: [
        expect.objectContaining({
          id: gameStorage.appState?.currentGame.id,
          moveCount: 1,
        }),
      ],
    });
  });

  it('routes text input through the same evaluation path as speech input', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });
    await gameEngine.handleTextInput('e4');

    expect(gameStorage.appState?.currentGame.moveHistory).toEqual([{ from: 'e2', san: 'e4', to: 'e4' }]);
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 1,
      gameOverReason: undefined,
      gameResult: undefined,
      isGameOver: false,
      lastInputEvaluateStatus: 'ok',
      lastInputResultMessage: 'e4',
      lastInputSanitized: 'e4',
      lastMoveColor: 'white',
      lastMovePiece: 'pawn',
      lastMoveSan: 'e4',
      legalMovesSan: expect.arrayContaining(['Nc6', 'Nf6', 'e5', 'c5']),
    });
  });

  it('treats persistence failures during move handling as hard errors', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    let saveAppStateShouldFail = false;
    const gameEngine = createGameEngine({
      gameStorage: {
        ...gameStorage,
        async saveAppState(nextAppState) {
          if (saveAppStateShouldFail) {
            throw new Error('Persist failed');
          }

          await gameStorage.saveAppState(nextAppState);
        },
      },
    });

    await gameEngine.init({});
    saveAppStateShouldFail = true;

    await expect(gameEngine.handleBoardMove('e4')).rejects.toThrow('Persist failed');
  });

  it('drops zero-move games from history when starting a new game', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({});
    const emptyGameId = gameStorage.appState?.currentGame.id;
    await gameEngine.newGame();

    await expect(gameStorage.loadSavedGameIndex()).resolves.toEqual({
      savedGames: [],
      schemaVersion: 1,
    });
    expect(gameStorage.deletedGameIds).not.toContain(emptyGameId);
  });

  it('uses consistent status snapshots when navigating through history', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });
    await gameEngine.handleBoardMove('e4');
    await gameEngine.handleBoardMove('e5');

    gameEngine.stepBackward();
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 1,
      lastInputEvaluateStatus: 'ignore',
      lastInputResultMessage: 'VIEWING PAST MOVE',
      lastMoveSan: 'e4',
    });

    gameEngine.goToStart();
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 0,
      lastInputEvaluateStatus: 'ignore',
      lastInputResultMessage: 'VIEWING PAST MOVE',
      lastMoveColor: undefined,
      lastMovePiece: undefined,
      lastMoveSan: '',
    });

    gameEngine.stepForward();
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 1,
      lastInputEvaluateStatus: 'ignore',
      lastInputResultMessage: 'VIEWING PAST MOVE',
      lastMoveSan: 'e4',
    });

    gameEngine.goToEnd();
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 2,
      lastInputEvaluateStatus: 'ok',
      lastInputResultMessage: 'OK',
      lastMoveColor: 'black',
      lastMovePiece: 'pawn',
      lastMoveSan: 'e5',
    });
  });

  it('reports ambiguous SAN input separately from other invalid moves', async () => {
    const storedAppState: AppState = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z'),
      currentGame: {
        ...createDefaultAppState('2026-03-30T00:00:00.000Z').currentGame,
        currentPly: 5,
        moveHistory: [
          { from: 'a2', san: 'a3', to: 'a3' },
          { from: 'b8', san: 'Nc6', to: 'c6' },
          { from: 'a3', san: 'a4', to: 'a4' },
          { from: 'e7', san: 'e6', to: 'e6' },
          { from: 'a4', san: 'a5', to: 'a5' },
        ],
      },
    };
    const gameStorage = createMemoryGameStorage(storedAppState);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });
    await gameEngine.handleBoardMove('Ne7');

    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 5,
      lastInputEvaluateStatus: 'illegal',
      lastInputIllegalReason: 'ambiguous',
      lastInputResultMessage: 'Ambiguous move',
      lastInputSanitized: 'Ne7',
      lastMoveSan: 'a5',
    });
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
    const onUiStateChange = vi.fn();
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

    await gameEngine.init({ onUiStateChange });
    await gameEngine.exportGamePgn('saved-game-1');
    await gameEngine.exportGameScoreSheet('saved-game-1');
    await gameEngine.openGameInLichess('saved-game-1');
    await gameEngine.openGameInChessDotCom('saved-game-1');
    await gameEngine.loadSavedGame('saved-game-1');

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
    expect(gameStorage.appState?.currentGame.currentPly).toBe(2);
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 2,
      lastInputEvaluateStatus: 'ok',
      lastInputResultMessage: 'OK',
      lastMoveSan: 'e5',
    });
  });

  it('rejects export requests for missing saved games', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({});

    await expect(gameEngine.exportGamePgn('missing-game')).rejects.toThrow('Saved game not found: missing-game');
    await expect(gameEngine.openGameInLichess('missing-game')).rejects.toThrow('Saved game not found: missing-game');
  });

  it('fills the metadata result and emits dedicated game-over state on checkmate', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });
    await gameEngine.handleBoardMove('f3');
    await gameEngine.handleBoardMove('e5');
    await gameEngine.handleBoardMove('g4');
    await gameEngine.handleBoardMove('Qh4#');

    expect(gameStorage.appState?.currentGame.metadata.result).toBe('0-1');
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      gameMetadata: {
        result: '0-1',
      },
      gameOverReason: 'Checkmate',
      gameResult: '0-1',
      isGameOver: true,
      lastMoveColor: 'black',
      lastMovePiece: 'queen',
      lastMoveSan: 'Qh4#',
    });
  });

  it('fills the metadata result and emits dedicated game-over state on stalemate', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });

    for (const move of [
      'e3',
      'a5',
      'Qh5',
      'Ra6',
      'Qxa5',
      'h5',
      'h4',
      'Rah6',
      'Qxc7',
      'f6',
      'Qxd7+',
      'Kf7',
      'Qxb7',
      'Qd3',
      'Qxb8',
      'Qh7',
      'Qxc8',
      'Kg6',
      'Qe6',
    ]) {
      await gameEngine.handleBoardMove(move);
    }

    expect(gameStorage.appState?.currentGame.metadata.result).toBe('1/2-1/2');
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      gameMetadata: {
        result: '1/2-1/2',
      },
      gameOverReason: 'Stalemate',
      gameResult: '1/2-1/2',
      isGameOver: true,
      lastMoveSan: 'Qe6',
    });
  });

  it('clears a prior terminal result only after the user branches to a different line', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });
    await gameEngine.handleBoardMove('f3');
    await gameEngine.handleBoardMove('e5');
    await gameEngine.handleBoardMove('g4');
    await gameEngine.handleBoardMove('Qh4#');

    gameEngine.stepBackward();

    expect(gameStorage.appState?.currentGame.metadata.result).toBe('0-1');
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      gameOverReason: undefined,
      gameResult: undefined,
      isGameOver: false,
    });

    await gameEngine.handleBoardMove('Nc6');

    expect(gameStorage.appState?.currentGame.metadata.result).toBe('');
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      gameMetadata: {
        result: '',
      },
      gameOverReason: undefined,
      gameResult: undefined,
      isGameOver: false,
      lastMoveColor: 'black',
      lastMovePiece: 'knight',
      lastMoveSan: 'Nc6',
    });
  });

  it('uses king for castling and the promoted piece for promotion icons', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });
    for (const move of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O']) {
      await gameEngine.handleBoardMove(move);
    }

    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      lastMoveColor: 'white',
      lastMovePiece: 'king',
      lastMoveSan: 'O-O',
    });

    const promotionState: AppState = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z'),
      currentGame: {
        ...createDefaultAppState('2026-03-30T00:00:00.000Z').currentGame,
        currentPly: 8,
        moveHistory: [
          { from: 'a2', san: 'a4', to: 'a4' },
          { from: 'h7', san: 'h5', to: 'h5' },
          { from: 'a4', san: 'a5', to: 'a5' },
          { from: 'h5', san: 'h4', to: 'h4' },
          { from: 'a5', san: 'a6', to: 'a6' },
          { from: 'h4', san: 'h3', to: 'h3' },
          { from: 'a6', san: 'axb7', to: 'b7' },
          { from: 'g7', san: 'g5', to: 'g5' },
        ],
      },
    };
    const promotionStorage = createMemoryGameStorage(promotionState);
    const promotionUi = vi.fn();
    const promotionEngine = createGameEngine({ gameStorage: promotionStorage });

    await promotionEngine.init({ onUiStateChange: promotionUi });
    await promotionEngine.handleBoardMove('bxa8=Q');

    expect(promotionUi.mock.calls.at(-1)?.[0]).toMatchObject({
      lastMoveColor: 'white',
      lastMovePiece: 'queen',
      lastMoveSan: 'bxa8=Q',
    });
  });

  it('emits board orientation changes in UI state', async () => {
    const gameStorage = createMemoryGameStorage(undefined);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });
    gameEngine.toggleBoardOrientation();

    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      boardOrientation: 'black',
      lastInputEvaluateStatus: 'ignore',
      lastInputResultMessage: 'Board orientation updated',
    });
  });

  it('discards the current game, removes saved data, and starts a fresh game', async () => {
    const seedAppState: AppState = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z'),
      currentGame: {
        ...createDefaultAppState('2026-03-30T00:00:00.000Z').currentGame,
        id: 'saved-game-1',
        moveHistory: [
          { from: 'e2', san: 'e4', to: 'e4' },
          { from: 'e7', san: 'e5', to: 'e5' },
        ],
      },
      savedGameIds: ['saved-game-1'],
    };
    const gameStorage = createMemoryGameStorage(seedAppState);
    await gameStorage.saveGame(seedAppState.currentGame);
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage });

    await gameEngine.init({ onUiStateChange });
    await gameEngine.discardGame();

    expect(gameStorage.deletedGameIds).toEqual(['saved-game-1']);
    expect(gameStorage.appState?.savedGameIds).toEqual([]);
    expect(gameStorage.appState?.currentGame.id).not.toBe('saved-game-1');
    expect(gameStorage.appState?.currentGame.moveHistory).toEqual([]);
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 0,
      lastInputResultMessage: 'Game discarded',
      pgn: expect.not.stringContaining('e4'),
    });
  });
});
