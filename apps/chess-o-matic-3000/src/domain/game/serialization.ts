import type { AppSettings } from '../settings/types';
import { APP_SETTINGS_DEFAULT } from '../settings/types';
import { createDefaultGameMetadata } from './metadata';
import type {
  AppState,
  GameBoardOrientation,
  GameId,
  GameMoveRecord,
  GameRecord,
  PersistedAppState,
  PersistedSavedGameIndex,
  SavedGameSummary,
} from './types';
import { APP_STATE_SCHEMA_VERSION, GAME_RECORD_SCHEMA_VERSION, SAVED_GAME_INDEX_SCHEMA_VERSION } from './version';

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return value;
}

/*[TODO: do we need this?]
function readBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return value;
}
*/

function readStringArray(value: unknown, fieldName: string): Array<string> {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return [...value];
}

function readOrientation(value: unknown): GameBoardOrientation {
  if (value === 'black') {
    return 'black';
  }

  return 'white';
}

function readMoveRecord(value: unknown, index: number): GameMoveRecord {
  if (!isRecord(value)) {
    throw new Error(`Invalid moveHistory[${index}].`);
  }

  return {
    from: readString(value.from, `moveHistory[${index}].from`),
    san: readString(value.san, `moveHistory[${index}].san`),
    to: readString(value.to, `moveHistory[${index}].to`),
  };
}

function readGameMetadata(value: unknown, createdAt: string): GameRecord['metadata'] {
  if (!isRecord(value)) {
    return createDefaultGameMetadata(createdAt);
  }

  const white = isRecord(value.white) ? value.white : {};
  const black = isRecord(value.black) ? value.black : {};
  const defaults = createDefaultGameMetadata(createdAt);

  return {
    black: {
      elo: typeof black.elo === 'string' ? black.elo : '',
      name: typeof black.name === 'string' ? black.name : '',
    },
    date: typeof value.date === 'string' ? value.date : defaults.date,
    event: typeof value.event === 'string' ? value.event : '',
    result: typeof value.result === 'string' ? value.result : '',
    round: typeof value.round === 'string' ? value.round : '',
    site: typeof value.site === 'string' ? value.site : '',
    termination: typeof value.termination === 'string' ? value.termination : '',
    timeControl: typeof value.timeControl === 'string' ? value.timeControl : '',
    white: {
      elo: typeof white.elo === 'string' ? white.elo : '',
      name: typeof white.name === 'string' ? white.name : '',
    },
  };
}

function readSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return APP_SETTINGS_DEFAULT;
  }

  return {
    audioInputEnabled:
      typeof value.audioInputEnabled === 'boolean' ? value.audioInputEnabled : APP_SETTINGS_DEFAULT.audioInputEnabled,
    audioOutputEnabled:
      typeof value.audioOutputEnabled === 'boolean'
        ? value.audioOutputEnabled
        : APP_SETTINGS_DEFAULT.audioOutputEnabled,
  };
}

function readGameRecord(value: unknown): GameRecord {
  if (!isRecord(value)) {
    throw new Error('Invalid currentGame.');
  }

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== GAME_RECORD_SCHEMA_VERSION) {
    throw new Error(`Unsupported game record schema version: ${String(schemaVersion)}.`);
  }

  const moveHistoryValue = Array.isArray(value.moveHistory) ? value.moveHistory : [];
  const moveHistory = moveHistoryValue.map((item, index) => readMoveRecord(item, index));
  const createdAt = readString(value.createdAt, 'currentGame.createdAt');

  return {
    createdAt,
    currentPly:
      typeof value.currentPly === 'number' && Number.isInteger(value.currentPly) && value.currentPly >= 0
        ? Math.min(value.currentPly, moveHistory.length)
        : moveHistory.length,
    id: readString(value.id, 'currentGame.id'),
    metadata: readGameMetadata(value.metadata, createdAt),
    moveHistory,
    orientation: readOrientation(value.orientation),
    schemaVersion: GAME_RECORD_SCHEMA_VERSION,
    status: value.status === 'finished' ? 'finished' : 'in-progress',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : createdAt,
  };
}

function readSavedGameSummary(value: unknown, index: number): SavedGameSummary {
  if (!isRecord(value)) {
    throw new Error(`Invalid savedGames[${index}].`);
  }

  return {
    black: readString(value.black, `savedGames[${index}].black`),
    createdAt: readString(value.createdAt, `savedGames[${index}].createdAt`),
    event: readString(value.event, `savedGames[${index}].event`),
    id: readString(value.id, `savedGames[${index}].id`),
    moveCount: typeof value.moveCount === 'number' && value.moveCount >= 0 ? value.moveCount : 0,
    updatedAt: readString(value.updatedAt, `savedGames[${index}].updatedAt`),
    white: readString(value.white, `savedGames[${index}].white`),
  };
}

export function serializeAppState(state: PersistedAppState): string {
  return JSON.stringify(state);
}

export function serializeSavedGameIndex(index: PersistedSavedGameIndex): string {
  return JSON.stringify(index);
}

export function normalizeAppState(state: PersistedAppState): AppState {
  return {
    currentGame: state.currentGame,
    savedGameIds: [...state.savedGameIds],
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    settings: state.settings,
  };
}

export function migratePersistedAppState(value: unknown): PersistedAppState {
  if (!isRecord(value)) {
    throw new Error('Invalid app state payload.');
  }

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== APP_STATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported app state schema version: ${String(schemaVersion)}.`);
  }

  return {
    currentGame: readGameRecord(value.currentGame),
    savedGameIds: readStringArray(value.savedGameIds, 'savedGameIds'),
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    settings: readSettings(value.settings),
  };
}

export function deserializeAppState(serializedState: string): PersistedAppState {
  return migratePersistedAppState(JSON.parse(serializedState) as unknown);
}

export function migratePersistedSavedGameIndex(value: unknown): PersistedSavedGameIndex {
  if (!isRecord(value)) {
    throw new Error('Invalid saved game index payload.');
  }

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== SAVED_GAME_INDEX_SCHEMA_VERSION) {
    throw new Error(`Unsupported saved game index schema version: ${String(schemaVersion)}.`);
  }

  const savedGames = Array.isArray(value.savedGames)
    ? value.savedGames.map((item, index) => readSavedGameSummary(item, index))
    : [];

  return {
    savedGames,
    schemaVersion: SAVED_GAME_INDEX_SCHEMA_VERSION,
  };
}

export function deserializeSavedGameIndex(serializedIndex: string): PersistedSavedGameIndex {
  return migratePersistedSavedGameIndex(JSON.parse(serializedIndex) as unknown);
}

export type SerializedGameRecordReference = {
  readonly gameId: GameId;
};
