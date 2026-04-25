import { describe, expect, it, vi } from 'vitest';

import { createBrowserExternalOpen } from './BrowserExternalOpen';

describe('createBrowserExternalOpen', () => {
  it('copies PGN and opens the lichess paste page', async () => {
    const openWindow = vi.fn();
    const writeClipboardText = vi.fn(async () => undefined);
    const externalOpen = createBrowserExternalOpen({
      openWindow,
      writeClipboardText,
    });

    await externalOpen.openLichess({ pgn: '1. e4 e5' });

    expect(writeClipboardText).toHaveBeenCalledWith('1. e4 e5');
    expect(openWindow).toHaveBeenCalledWith('https://lichess.org/paste?pgn=1.+e4+e5');
  });

  it('still opens the target page when clipboard writing is unavailable', async () => {
    const openWindow = vi.fn();
    const externalOpen = createBrowserExternalOpen({
      openWindow,
      writeClipboardText: undefined,
    });

    await externalOpen.openChessDotCom({ pgn: '1. d4 d5' });

    expect(openWindow).toHaveBeenCalledWith('https://www.chess.com/analysis?pgn=1.+d4+d5&tab=analysis');
  });
});
