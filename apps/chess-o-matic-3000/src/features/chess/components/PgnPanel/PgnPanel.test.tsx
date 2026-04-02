import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { PgnPanel } from './index';

describe('PgnPanel', () => {
  it('shows the raw PGN textarea and external open actions', () => {
    const root = document.createElement('div');
    const onOpenLichess = vi.fn();
    const onOpenChessDotCom = vi.fn();
    document.body.append(root);

    render(
      () => (
        <PgnPanel
          currentPly={2}
          onGoToPly={vi.fn()}
          onOpenChessDotCom={onOpenChessDotCom}
          onOpenLichess={onOpenLichess}
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

    const buttons = Array.from(root.querySelectorAll('button'));
    const lichessButton = buttons.find((button) => button.textContent?.includes('Open in Lichess')) as
      | HTMLButtonElement
      | undefined;
    const chessDotComButton = buttons.find((button) => button.textContent?.includes('Open in Chess.com')) as
      | HTMLButtonElement
      | undefined;

    lichessButton?.click();
    chessDotComButton?.click();

    expect(onOpenLichess).toHaveBeenCalledTimes(1);
    expect(onOpenChessDotCom).toHaveBeenCalledTimes(1);
    expect((root.querySelector('[aria-label="PGN"]') as HTMLTextAreaElement | null)?.value).toBe(
      '1. e4 e5 2. Nf3 Nc6'
    );
    expect(root.textContent).not.toContain('Copy PGN');
  });
});
