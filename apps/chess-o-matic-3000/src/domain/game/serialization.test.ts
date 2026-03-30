import { describe, expect, it } from 'vitest';

import { GAME_METADATA_EMPTY } from './metadata';
import {
  deserializeAppState,
  deserializeSavedGameIndex,
  migratePersistedAppState,
  migratePersistedSavedGameIndex,
  serializeAppState,
} from './serialization';
import { createDefaultAppState } from './types';

describe('game serialization', () => {
  it('round-trips app state', () => {
    const state = {
      ...createDefaultAppState('2026-03-30T00:00:00.000Z'),
      currentGame: {
        ...createDefaultAppState('2026-03-30T00:00:00.000Z').currentGame,
        currentPly: 2,
        id: 'game-1',
        metadata: {
          ...GAME_METADATA_EMPTY,
          event: 'Club Night',
          white: {
            ...GAME_METADATA_EMPTY.white,
            name: 'Alice',
          },
        },
        moveHistory: [
          { from: 'e2', san: 'e4', to: 'e4' },
          { from: 'e7', san: 'e5', to: 'e5' },
        ],
        updatedAt: '2026-03-30T00:05:00.000Z',
      },
      savedGameIds: ['game-1'],
      settings: {
        audioInputEnabled: true,
        audioOutputEnabled: false,
      },
    };

    expect(deserializeAppState(serializeAppState(state))).toEqual(state);
  });

  it('fills missing optional fields with defaults', () => {
    const restored = migratePersistedAppState({
      currentGame: {
        createdAt: '2026-03-30T00:00:00.000Z',
        id: 'game-1',
        moveHistory: [{ from: 'e2', san: 'e4', to: 'e4' }],
        schemaVersion: 1,
      },
      savedGameIds: [],
      schemaVersion: 1,
    });

    expect(restored.currentGame.orientation).toBe('white');
    expect(restored.currentGame.updatedAt).toBe('2026-03-30T00:00:00.000Z');
    expect(restored.currentGame.metadata).toEqual({
      ...GAME_METADATA_EMPTY,
      date: '2026-03-30',
    });
    expect(restored.settings).toEqual({
      audioInputEnabled: false,
      audioOutputEnabled: false,
    });
  });

  it('clamps current ply to the available move history length', () => {
    const restored = migratePersistedAppState({
      currentGame: {
        createdAt: '2026-03-30T00:00:00.000Z',
        currentPly: 99,
        id: 'game-1',
        moveHistory: [{ from: 'e2', san: 'e4', to: 'e4' }],
        schemaVersion: 1,
      },
      savedGameIds: [],
      schemaVersion: 1,
    });

    expect(restored.currentGame.currentPly).toBe(1);
  });

  it('rejects unsupported schema versions', () => {
    expect(() =>
      migratePersistedAppState({
        currentGame: {
          createdAt: '2026-03-30T00:00:00.000Z',
          id: 'game-1',
          moveHistory: [],
          schemaVersion: 1,
        },
        savedGameIds: [],
        schemaVersion: 999,
      })
    ).toThrow('Unsupported app state schema version: 999.');
  });

  it('keeps schema version 1 payloads stable through migration', () => {
    const payload = {
      currentGame: {
        createdAt: '2026-03-30T00:00:00.000Z',
        currentPly: 0,
        id: 'game-1',
        metadata: GAME_METADATA_EMPTY,
        moveHistory: [],
        orientation: 'black',
        schemaVersion: 1,
        status: 'in-progress',
        updatedAt: '2026-03-30T00:00:00.000Z',
      },
      savedGameIds: ['game-1'],
      schemaVersion: 1,
      settings: {
        audioInputEnabled: true,
        audioOutputEnabled: true,
      },
    };

    expect(migratePersistedAppState(payload)).toEqual(payload);
  });

  it('migrates saved-game indexes with schema version 1', () => {
    const payload = {
      savedGames: [
        {
          black: 'Bob',
          createdAt: '2026-03-30T00:00:00.000Z',
          event: 'League Match',
          id: 'game-1',
          moveCount: 42,
          updatedAt: '2026-03-30T00:10:00.000Z',
          white: 'Alice',
        },
      ],
      schemaVersion: 1,
    };

    expect(migratePersistedSavedGameIndex(payload)).toEqual(payload);
    expect(deserializeSavedGameIndex(JSON.stringify(payload))).toEqual(payload);
  });

  it('rejects unsupported saved-game index schema versions', () => {
    expect(() =>
      migratePersistedSavedGameIndex({
        savedGames: [],
        schemaVersion: 999,
      })
    ).toThrow('Unsupported saved game index schema version: 999.');
  });
});
