import type { ExternalOpen } from '../../ports/ExternalOpen';
import type { ExternalOpenRequest } from '../../types/export';

const LICHESS_PASTE_URL = 'https://lichess.org/paste';
const CHESS_DOT_COM_ANALYSIS_URL = 'https://www.chess.com/analysis';

type BrowserExternalOpenDeps = {
  readonly openWindow?: (url: string) => void;
  readonly writeClipboardText?: (value: string) => Promise<void>;
};

export function createBrowserExternalOpen(deps: BrowserExternalOpenDeps = {}): ExternalOpen {
  const openWindow = deps.openWindow ?? ((url: string) => window.open(url, '_blank', 'noopener,noreferrer'));
  const writeClipboardText =
    deps.writeClipboardText ??
    (async (value: string) => {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        return;
      }

      await navigator.clipboard.writeText(value);
    });

  async function openLichess(request: ExternalOpenRequest): Promise<void> {
    await openWithPgn(LICHESS_PASTE_URL, request);
  }

  async function openChessDotCom(request: ExternalOpenRequest): Promise<void> {
    await openWithPgn(CHESS_DOT_COM_ANALYSIS_URL, request);
  }

  async function openWithPgn(url: string, request: ExternalOpenRequest): Promise<void> {
    await writeClipboardText(request.pgn);
    openWindow(url);
  }

  return {
    openChessDotCom,
    openLichess,
  };
}
