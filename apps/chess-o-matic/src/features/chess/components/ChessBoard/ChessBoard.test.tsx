import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { START_FEN } from '../../../../game-model/consts';
import type { ChessBoardController } from './controller';
import { ChessBoard } from './index';

describe('ChessBoard', () => {
  it('renders the gchessboard wrapper, reports a controller, and toggles orientation from the button', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const getAnimationsSpy = vi.fn(() => []);
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: getAnimationsSpy,
    });

    const onReady = vi.fn();

    render(
      () => (
        <ChessBoard
          fen={START_FEN}
          getPromotionPieceColor={() => undefined}
          isLegalMove={() => true}
          onMove={async () => Promise.resolve()}
          onReady={onReady}
        />
      ),
      root
    );

    await Promise.resolve();

    expect(root.querySelector('g-chess-board')).not.toBeNull();
    expect(onReady).toHaveBeenCalled();

    const controller = onReady.mock.calls[0]?.[0] as ChessBoardController | undefined;
    const toggleButton = root.querySelector('button[type="button"]') as HTMLButtonElement | null;

    expect(controller?.orientation()).toBe('light');
    expect(toggleButton?.textContent).toContain('Toggle Board Orientation');

    toggleButton?.click();

    expect(controller?.orientation()).toBe('dark');

    // eslint-disable-next-line fp/no-delete
    delete (Element.prototype as Partial<Element> & { getAnimations?: () => Array<Animation> }).getAnimations;
  });
});
