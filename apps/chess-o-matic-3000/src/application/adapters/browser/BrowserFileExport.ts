import type { FileExport } from '../../ports/FileExport';
import type { PgnExportDocument, ScoreSheetExportDocument } from '../../types/export';
import { SCORE_SHEET_EXPORT_FORMAT_PDF } from '../../types/export';

type BrowserFileExportDeps = {
  readonly createObjectUrl?: (blob: Blob) => string;
  readonly createLink?: () => HTMLAnchorElement;
  readonly revokeObjectUrl?: (url: string) => void;
};

export function createBrowserFileExport(deps: BrowserFileExportDeps = {}): FileExport {
  const createObjectUrl = deps.createObjectUrl ?? ((blob: Blob) => URL.createObjectURL(blob));
  const createLink = deps.createLink ?? (() => document.createElement('a'));
  const revokeObjectUrl = deps.revokeObjectUrl ?? ((url: string) => URL.revokeObjectURL(url));

  async function exportPgn(document: PgnExportDocument): Promise<void> {
    downloadFile(document.fileName, document.mimeType, document.pgn);
  }

  async function exportScoreSheet(document: ScoreSheetExportDocument): Promise<void> {
    if (document.format === SCORE_SHEET_EXPORT_FORMAT_PDF) {
      throw new Error('PDF scoresheet export is not supported by the browser adapter yet.');
    }

    downloadFile(document.fileName, document.mimeType, document.content);
  }

  function downloadFile(fileName: string, mimeType: string, content: string): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
      throw new Error('File export is only supported in browser environments.');
    }

    const objectUrl = createObjectUrl(new Blob([content], { type: mimeType }));
    const link = createLink();

    link.href = objectUrl;
    link.download = fileName;
    link.click();

    revokeObjectUrl(objectUrl);
  }

  return {
    exportPgn,
    exportScoreSheet,
  };
}
