import { describe, expect, it, vi } from 'vitest';

import { createBrowserFileExport } from './BrowserFileExport';

describe('createBrowserFileExport', () => {
  it('downloads a PGN document through a browser link', async () => {
    const click = vi.fn();
    const createObjectUrl = vi.fn(() => 'blob:game');
    const revokeObjectUrl = vi.fn();
    const createLink = vi.fn(
      () =>
        ({
          click,
          download: '',
          href: '',
        }) as unknown as HTMLAnchorElement
    );
    const fileExport = createBrowserFileExport({
      createLink,
      createObjectUrl,
      revokeObjectUrl,
    });

    await fileExport.exportPgn({
      fileName: 'game.pgn',
      mimeType: 'application/x-chess-pgn',
      pgn: '1. e4 e5',
    });

    expect(createLink).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:game');
  });

  it('rejects PDF scoresheet export in the browser adapter for now', async () => {
    const fileExport = createBrowserFileExport();

    await expect(
      fileExport.exportScoreSheet({
        content: '1. e4 e5',
        fileName: 'scoresheet.pdf',
        format: 'pdf',
        mimeType: 'application/pdf',
      })
    ).rejects.toThrow('PDF scoresheet export is not supported by the browser adapter yet.');
  });
});
