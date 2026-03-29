import type { GameRecord } from '../../domain/game/types';

export type FileExport = {
  readonly exportPgn: (game: GameRecord) => Promise<void>;
  readonly exportScoreSheetPdf: (game: GameRecord) => Promise<void>;
};
