import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { PgnPanel } from './PgnPanel';

describe('PgnPanel', () => {
  it('copies the PGN text and navigates when a move pill is clicked', async () => {
    const root = document.createElement('div');
    const writeText = vi.fn(async () => undefined);
    const onGoToPly = vi.fn();
    document.body.append(root);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      () => (
        <PgnPanel
          currentPly={2}
          onGoToPly={onGoToPly}
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

    const copyButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Copy PGN'
    ) as HTMLButtonElement | undefined;
    const e4Button = Array.from(root.querySelectorAll('button')).find((button) => button.textContent === 'e4') as
      | HTMLButtonElement
      | undefined;
    const activeMoveButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'e5'
    ) as HTMLButtonElement | undefined;

    copyButton?.click();
    e4Button?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('1. e4 e5 2. Nf3 Nc6');
    expect(onGoToPly).toHaveBeenCalledWith(1);
    expect(activeMoveButton?.className).toContain('bg-slate-200');
  });

  it('shows the raw PGN textarea behind the raw tab', () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(() => <PgnPanel currentPly={0} onGoToPly={vi.fn()} pgn={'1. e4'} pgnMoveList={[]} />, root);

    const rawTabButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Raw PGN'
    ) as HTMLButtonElement | undefined;

    rawTabButton?.click();

    expect((root.querySelector('[aria-label="PGN"]') as HTMLTextAreaElement | null)?.value).toBe('1. e4');
  });
});
