import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { PgnPanel } from './index';

describe('PgnPanel', () => {
  it('copies the PGN text and shows the raw PGN textarea', async () => {
    const root = document.createElement('div');
    const writeText = vi.fn(async () => undefined);
    document.body.append(root);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      () => (
        <PgnPanel
          currentPly={2}
          onGoToPly={vi.fn()}
          pgn={'1. e4 e5 2. Nf3 Nc6'}
          pgnMoveList={[
            { moveNumber: 1, ply: 1, san: 'e4', side: 'white' },
            { moveNumber: 1, ply: 2, san: 'e5', side: 'black' },
            { moveNumber: 2, ply: 3, san: 'Nf3', side: 'white' },
            { moveNumber: 2, ply: 4, san: 'Nc6', side: 'black' },
          ]}
        />
      ),
      root
    );

    const copyButton = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Copy PGN')
    ) as HTMLButtonElement | undefined;

    copyButton?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('1. e4 e5 2. Nf3 Nc6');
    expect(copyButton?.textContent).toContain('Copied');
    expect((root.querySelector('[aria-label="PGN"]') as HTMLTextAreaElement | null)?.value).toBe(
      '1. e4 e5 2. Nf3 Nc6'
    );
  });

  it('resets the copied state when the PGN changes and still copies while already copied', async () => {
    const root = document.createElement('div');
    const writeText = vi.fn(async () => undefined);
    document.body.append(root);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(() => {
      const [pgn, setPgn] = createSignal('1. e4');

      function changePgn(): void {
        setPgn('1. d4');
      }

      return (
        <>
          <PgnPanel currentPly={0} onGoToPly={vi.fn()} pgn={pgn()} pgnMoveList={[]} />
          <button onClick={changePgn} type="button">
            Change PGN
          </button>
        </>
      );
    }, root);

    const copyButton = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Copy PGN')
    ) as HTMLButtonElement | undefined;
    const changeButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Change PGN'
    ) as HTMLButtonElement | undefined;

    copyButton?.click();
    await Promise.resolve();
    copyButton?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenNthCalledWith(1, '1. e4');
    expect(writeText).toHaveBeenNthCalledWith(2, '1. e4');
    expect(copyButton?.textContent).toContain('Copied');

    changeButton?.click();
    await Promise.resolve();

    expect(copyButton?.textContent).toContain('Copy PGN');
  });
});
