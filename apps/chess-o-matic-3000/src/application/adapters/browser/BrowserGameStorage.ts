/* eslint-disable fp/no-this */
import {
  deserializeAppState,
  deserializeSavedGameIndex,
  serializeAppState,
  serializeSavedGameIndex,
} from '../../../domain/game/serialization';
import {
  EMPTY_PERSISTED_SAVED_GAME_INDEX,
  type GameId,
  type GameRecord,
  type PersistedAppState,
  type PersistedSavedGameIndex,
} from '../../../domain/game/types';
import type { GameStorage } from '../../ports/GameStorage';

const APP_STATE_KEY = 'chess-o-matic-3000/app-state';
const SAVED_GAME_INDEX_KEY = 'chess-o-matic-3000/saved-games/index';
const SAVED_GAME_PREFIX = 'chess-o-matic-3000/saved-games/';

function gameStorageKey(gameId: GameId): string {
  return `${SAVED_GAME_PREFIX}${gameId}`;
}

function serializeGameRecord(game: GameRecord): string {
  return JSON.stringify(game);
}

function deserializeGameRecord(serializedGame: string): GameRecord {
  return JSON.parse(serializedGame) as GameRecord;
}

function summarizeGame(game: GameRecord): PersistedSavedGameIndex['savedGames'][number] {
  return {
    black: game.metadata.black.name,
    createdAt: game.createdAt,
    date: game.metadata.date,
    event: game.metadata.event,
    id: game.id,
    moveCount: game.moveHistory.length,
    updatedAt: game.updatedAt,
    white: game.metadata.white.name,
  };
}

export function browserGameStorageIsSupported(): boolean {
  return typeof localStorage !== 'undefined';
}

export function createBrowserGameStorage(): GameStorage {
  return {
    async deleteGame(gameId: GameId): Promise<void> {
      if (!browserGameStorageIsSupported()) {
        return;
      }

      localStorage.removeItem(gameStorageKey(gameId));
      const index = await this.loadSavedGameIndex();
      const nextIndex: PersistedSavedGameIndex = {
        ...index,
        savedGames: index.savedGames.filter((savedGame) => savedGame.id !== gameId),
      };
      localStorage.setItem(SAVED_GAME_INDEX_KEY, serializeSavedGameIndex(nextIndex));
    },

    async loadAppState(): Promise<PersistedAppState | undefined> {
      if (!browserGameStorageIsSupported()) {
        return undefined;
      }

      const serializedState = localStorage.getItem(APP_STATE_KEY);
      return serializedState ? deserializeAppState(serializedState) : undefined;
    },

    async loadGame(gameId: GameId): Promise<GameRecord | undefined> {
      if (!browserGameStorageIsSupported()) {
        return undefined;
      }

      const serializedGame = localStorage.getItem(gameStorageKey(gameId));
      return serializedGame ? deserializeGameRecord(serializedGame) : undefined;
    },

    async loadSavedGameIndex(): Promise<PersistedSavedGameIndex> {
      if (!browserGameStorageIsSupported()) {
        return EMPTY_PERSISTED_SAVED_GAME_INDEX;
      }

      const serializedIndex = localStorage.getItem(SAVED_GAME_INDEX_KEY);
      return serializedIndex ? deserializeSavedGameIndex(serializedIndex) : EMPTY_PERSISTED_SAVED_GAME_INDEX;
    },

    async saveAppState(state: PersistedAppState): Promise<void> {
      if (!browserGameStorageIsSupported()) {
        return;
      }

      localStorage.setItem(APP_STATE_KEY, serializeAppState(state));
    },

    async saveGame(game: GameRecord): Promise<void> {
      if (!browserGameStorageIsSupported()) {
        return;
      }

      localStorage.setItem(gameStorageKey(game.id), serializeGameRecord(game));
      const index = await this.loadSavedGameIndex();
      const nextSummary = summarizeGame(game);
      const nextIndex: PersistedSavedGameIndex = {
        ...index,
        savedGames: [nextSummary, ...index.savedGames.filter((savedGame) => savedGame.id !== game.id)],
      };
      localStorage.setItem(SAVED_GAME_INDEX_KEY, serializeSavedGameIndex(nextIndex));
    },
  };
}
