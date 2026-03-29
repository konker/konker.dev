import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { FenPanel } from './FenPanel';

describe('FenPanel', () => {
  it('copies the FEN text to the clipboard', async () => {
    const root = document.createElement('div');
    const writeText = vi.fn(async () => undefined);
    document.body.append(root);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(() => <FenPanel fen={'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'} />, root);

    const copyButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Copy FEN'
    ) as HTMLButtonElement | undefined;

    copyButton?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });
});
