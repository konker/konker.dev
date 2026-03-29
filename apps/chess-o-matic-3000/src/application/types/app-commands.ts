import type { GameMetadataData } from '../../domain/game/metadata';
import type { GameBoardOrientation, GameId } from '../../domain/game/types';
import type { ScoreSheetExportFormat } from './export';

export type AppCommandNewGame = {
  readonly type: 'newGame';
};

export type AppCommandResetGame = {
  readonly type: 'resetGame';
};

export type AppCommandSaveGame = {
  readonly type: 'saveGame';
  readonly gameId?: GameId;
};

export type AppCommandLoadGame = {
  readonly type: 'loadGame';
  readonly gameId: GameId;
};

export type AppCommandDeleteGame = {
  readonly type: 'deleteGame';
  readonly gameId: GameId;
};

export type AppCommandExportGamePgn = {
  readonly type: 'exportGamePgn';
  readonly gameId?: GameId;
};

export type AppCommandExportGameScoreSheet = {
  readonly type: 'exportGameScoreSheet';
  readonly gameId?: GameId;
  readonly format?: ScoreSheetExportFormat;
};

export type AppCommandOpenGameInLichess = {
  readonly type: 'openGameInLichess';
  readonly gameId?: GameId;
};

export type AppCommandOpenGameInChessDotCom = {
  readonly type: 'openGameInChessDotCom';
  readonly gameId?: GameId;
};

export type AppCommandMakeMove = {
  readonly type: 'makeMove';
  readonly move: [string, string] | string;
};

export type AppCommandGoToPly = {
  readonly type: 'goToPly';
  readonly ply: number;
};

export type AppCommandSetMetadata = {
  readonly metadata: GameMetadataData;
  readonly type: 'setMetadata';
};

export type AppCommandToggleOrientation = {
  readonly type: 'toggleOrientation';
};

export type AppCommandSetOrientation = {
  readonly orientation: GameBoardOrientation;
  readonly type: 'setOrientation';
};

export type AppCommandSetAudioInputEnabled = {
  readonly enabled: boolean;
  readonly type: 'setAudioInputEnabled';
};

export type AppCommandSetAudioOutputEnabled = {
  readonly enabled: boolean;
  readonly type: 'setAudioOutputEnabled';
};

export type AppCommand =
  | AppCommandNewGame
  | AppCommandResetGame
  | AppCommandSaveGame
  | AppCommandLoadGame
  | AppCommandDeleteGame
  | AppCommandExportGamePgn
  | AppCommandExportGameScoreSheet
  | AppCommandOpenGameInLichess
  | AppCommandOpenGameInChessDotCom
  | AppCommandMakeMove
  | AppCommandGoToPly
  | AppCommandSetMetadata
  | AppCommandToggleOrientation
  | AppCommandSetOrientation
  | AppCommandSetAudioInputEnabled
  | AppCommandSetAudioOutputEnabled;
