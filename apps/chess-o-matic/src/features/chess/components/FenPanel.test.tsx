import { createSignal } from 'solid-js';
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

    const copyButton = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Copy FEN')
    ) as HTMLButtonElement | undefined;

    copyButton?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(copyButton?.textContent).toContain('Copied');
  });

  it('resets the copied state when the FEN changes and still copies while already copied', async () => {
    const root = document.createElement('div');
    const writeText = vi.fn(async () => undefined);
    document.body.append(root);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(() => {
      const [fen, setFen] = createSignal('fen-one');

      function changeFen(): void {
        setFen('fen-two');
      }

      return (
        <>
          <FenPanel fen={fen()} />
          <button onClick={changeFen} type="button">
            Change FEN
          </button>
        </>
      );
    }, root);

    const copyButton = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Copy FEN')
    ) as HTMLButtonElement | undefined;
    const changeButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Change FEN'
    ) as HTMLButtonElement | undefined;

    copyButton?.click();
    await Promise.resolve();
    copyButton?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenNthCalledWith(1, 'fen-one');
    expect(writeText).toHaveBeenNthCalledWith(2, 'fen-one');
    expect(copyButton?.textContent).toContain('Copied');

    changeButton?.click();
    await Promise.resolve();

    expect(copyButton?.textContent).toContain('Copy FEN');
  });
});
