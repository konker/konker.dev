import type { GameId, GameRecord, PersistedAppState, PersistedSavedGameIndex } from '../../domain/game/types';

export type GameStorage = {
  readonly deleteGame: (gameId: GameId) => Promise<void>;
  readonly loadAppState: () => Promise<PersistedAppState | undefined>;
  readonly loadGame: (gameId: GameId) => Promise<GameRecord | undefined>;
  readonly loadSavedGameIndex: () => Promise<PersistedSavedGameIndex>;
  readonly saveAppState: (state: PersistedAppState) => Promise<void>;
  readonly saveGame: (game: GameRecord) => Promise<void>;
};
