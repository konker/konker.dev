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
    expect(openWindow).toHaveBeenCalledWith('https://lichess.org/paste');
  });
});
