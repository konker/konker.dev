import type { GameMetadataData } from '../../domain/game/metadata';
import type { GameBoardOrientation, GameId } from '../../domain/game/types';
import type { AppSettings } from '../../domain/settings/types';

export type AppEventAppInitialized = {
  readonly type: 'appInitialized';
};

export type AppEventGameLoaded = {
  readonly gameId: GameId;
  readonly type: 'gameLoaded';
};

export type AppEventGameSaved = {
  readonly gameId: GameId;
  readonly type: 'gameSaved';
};

export type AppEventGameDeleted = {
  readonly gameId: GameId;
  readonly type: 'gameDeleted';
};

export type AppEventGameReset = {
  readonly gameId: GameId;
  readonly type: 'gameReset';
};

export type AppEventMoveMade = {
  readonly move: [string, string] | string;
  readonly type: 'moveMade';
};

export type AppEventMetadataUpdated = {
  readonly metadata: GameMetadataData;
  readonly type: 'metadataUpdated';
};

export type AppEventOrientationChanged = {
  readonly orientation: GameBoardOrientation;
  readonly type: 'orientationChanged';
};

export type AppEventSettingsChanged = {
  readonly settings: AppSettings;
  readonly type: 'settingsChanged';
};

export type AppEventFeatureUnavailable = {
  readonly feature: 'audioInput' | 'audioOutput' | 'externalOpen' | 'fileExport' | 'storage';
  readonly reason: string;
  readonly type: 'featureUnavailable';
};

export type AppEvent =
  | AppEventAppInitialized
  | AppEventGameLoaded
  | AppEventGameSaved
  | AppEventGameDeleted
  | AppEventGameReset
  | AppEventMoveMade
  | AppEventMetadataUpdated
  | AppEventOrientationChanged
  | AppEventSettingsChanged
  | AppEventFeatureUnavailable;
