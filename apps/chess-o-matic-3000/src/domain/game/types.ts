import type { AppSettings } from '../settings/types';
import { APP_SETTINGS_DEFAULT } from '../settings/types';
import type { GameMetadataData } from './metadata';
import { GAME_METADATA_EMPTY } from './metadata';
import { APP_STATE_SCHEMA_VERSION, GAME_RECORD_SCHEMA_VERSION, SAVED_GAME_INDEX_SCHEMA_VERSION } from './version';

export type GameId = string;

export const GAME_BOARD_ORIENTATION_WHITE = 'white' as const;
export const GAME_BOARD_ORIENTATION_BLACK = 'black' as const;
export type GameBoardOrientation = typeof GAME_BOARD_ORIENTATION_WHITE | typeof GAME_BOARD_ORIENTATION_BLACK;

export const GAME_RECORD_STATUS_IN_PROGRESS = 'in-progress' as const;
export const GAME_RECORD_STATUS_FINISHED = 'finished' as const;
export type GameRecordStatus = typeof GAME_RECORD_STATUS_IN_PROGRESS | typeof GAME_RECORD_STATUS_FINISHED;

export type GameMoveRecord = {
  readonly from: string;
  readonly san: string;
  readonly to: string;
};

export type GameRecordMetadata = GameMetadataData;

export type GameRecord = {
  readonly createdAt: string;
  readonly currentPly: number;
  readonly id: GameId;
  readonly metadata: GameRecordMetadata;
  readonly moveHistory: Array<GameMoveRecord>;
  readonly orientation: GameBoardOrientation;
  readonly schemaVersion: typeof GAME_RECORD_SCHEMA_VERSION;
  readonly status: GameRecordStatus;
  readonly updatedAt: string;
};

export type AppState = {
  readonly currentGame: GameRecord;
  readonly savedGameIds: Array<GameId>;
  readonly schemaVersion: typeof APP_STATE_SCHEMA_VERSION;
  readonly settings: AppSettings;
};

export type PersistedAppState = AppState;

export type SavedGameSummary = {
  readonly createdAt: string;
  readonly id: GameId;
  readonly moveCount: number;
  readonly updatedAt: string;
  readonly white: string;
  readonly black: string;
  readonly event: string;
};

export type PersistedSavedGameIndex = {
  readonly savedGames: Array<SavedGameSummary>;
  readonly schemaVersion: typeof SAVED_GAME_INDEX_SCHEMA_VERSION;
};

export function createEmptyGameRecord(now: string = new Date().toISOString(), id: GameId = 'current-game'): GameRecord {
  return {
    createdAt: now,
    currentPly: 0,
    id,
    metadata: GAME_METADATA_EMPTY,
    moveHistory: [],
    orientation: GAME_BOARD_ORIENTATION_WHITE,
    schemaVersion: GAME_RECORD_SCHEMA_VERSION,
    status: GAME_RECORD_STATUS_IN_PROGRESS,
    updatedAt: now,
  };
}

export function createDefaultAppState(now: string = new Date().toISOString()): AppState {
  return {
    currentGame: createEmptyGameRecord(now),
    savedGameIds: [],
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    settings: APP_SETTINGS_DEFAULT,
  };
}

export const EMPTY_PERSISTED_SAVED_GAME_INDEX: PersistedSavedGameIndex = {
  savedGames: [],
  schemaVersion: SAVED_GAME_INDEX_SCHEMA_VERSION,
} as const;
