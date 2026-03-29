import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import type { GameBoardOrientation } from '../../../../domain/game/types';
import { GAME_BOARD_ORIENTATION_WHITE } from '../../../../domain/game/types';
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
    const [orientation, setOrientation] = createSignal<GameBoardOrientation>(GAME_BOARD_ORIENTATION_WHITE);

    render(
      () => (
        <ChessBoard
          fen={START_FEN}
          getPromotionPieceColor={() => undefined}
          isLegalMove={() => true}
          onMove={async () => Promise.resolve()}
          onReady={onReady}
          onToggleOrientation={() => setOrientation((current) => (current === 'white' ? 'black' : 'white'))}
          orientation={orientation()}
        />
      ),
      root
    );

    await Promise.resolve();

    expect(root.querySelector('g-chess-board')).not.toBeNull();
    expect(onReady).toHaveBeenCalled();

    const controller = onReady.mock.calls[0]?.[0] as ChessBoardController | undefined;
    const toggleButton = root.querySelector('button[type="button"]') as HTMLButtonElement | null;
    const board = root.querySelector('g-chess-board') as { orientation?: string } | null;

    expect(controller).toBeDefined();
    expect(toggleButton?.textContent).toContain('Toggle Board Orientation');
    expect(board?.orientation).toBe('white');

    toggleButton?.click();
    await Promise.resolve();

    expect(board?.orientation).toBe('black');

    // eslint-disable-next-line fp/no-delete
    delete (Element.prototype as Partial<Element> & { getAnimations?: () => Array<Animation> }).getAnimations;
  });
});
