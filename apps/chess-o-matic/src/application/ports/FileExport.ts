import type { PgnExportDocument, ScoreSheetExportDocument } from '../types/export';

export type FileExport = {
  readonly exportPgn: (document: PgnExportDocument) => Promise<void>;
  readonly exportScoreSheet: (document: ScoreSheetExportDocument) => Promise<void>;
};
