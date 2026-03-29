export const SCORE_SHEET_EXPORT_FORMAT_TEXT = 'txt' as const;
export const SCORE_SHEET_EXPORT_FORMAT_PDF = 'pdf' as const;

export type ScoreSheetExportFormat = typeof SCORE_SHEET_EXPORT_FORMAT_TEXT | typeof SCORE_SHEET_EXPORT_FORMAT_PDF;

export type PgnExportDocument = {
  readonly fileName: string;
  readonly mimeType: 'application/x-chess-pgn' | 'text/plain';
  readonly pgn: string;
};

export type ScoreSheetExportDocument = {
  readonly fileName: string;
  readonly format: ScoreSheetExportFormat;
  readonly mimeType: 'application/pdf' | 'text/plain';
  readonly content: string;
};

export type ExternalOpenRequest = {
  readonly pgn: string;
};
