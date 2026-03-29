import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { PgnPanel } from './PgnPanel';

describe('PgnPanel', () => {
  it('copies the PGN text to the clipboard', async () => {
    const root = document.createElement('div');
    const writeText = vi.fn(async () => undefined);
    document.body.append(root);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(() => <PgnPanel pgn={'1. e4 e5 2. Nf3 Nc6'} />, root);

    const copyButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Copy PGN'
    ) as HTMLButtonElement | undefined;

    copyButton?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('1. e4 e5 2. Nf3 Nc6');
  });
});
