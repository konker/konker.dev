import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import type { GameBoardOrientation } from '../../../../domain/game/types';
import { GAME_BOARD_ORIENTATION_WHITE } from '../../../../domain/game/types';
import { START_FEN } from '../../../../game-model/consts';
import type { ChessBoardController } from './controller';
import { ChessBoard } from './index';

describe('ChessBoard', () => {
  it('restores persisted coordinates visibility and color scheme from localStorage', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    localStorage.setItem('chess-o-matic-3000/ui/board-color-scheme', 'brown');
    localStorage.setItem('chess-o-matic-3000/ui/board-coordinates-visible', 'false');
    const getAnimationsSpy = vi.fn(() => []);
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: getAnimationsSpy,
    });

    render(
      () => (
        <ChessBoard
          fen={START_FEN}
          getPromotionPieceColor={() => undefined}
          isLegalMove={() => true}
          onMove={async () => Promise.resolve()}
          onReady={vi.fn()}
          onToggleOrientation={vi.fn()}
          orientation={GAME_BOARD_ORIENTATION_WHITE}
        />
      ),
      root
    );

    await Promise.resolve();

    const board = root.querySelector('g-chess-board') as { coordinates?: string } | null;
    const colorSchemeToggle = root.querySelector(
      'button[aria-label="Toggle Board Color Scheme"]'
    ) as HTMLButtonElement | null;
    const coordinatesText = root.querySelector('button[aria-label="Toggle Board Coordinates"] span') as HTMLElement | null;

    expect(board?.coordinates).toBe('hidden');
    expect(colorSchemeToggle?.style.backgroundColor).toBe('rgb(181, 136, 99)');
    expect(coordinatesText?.className).toContain('line-through');
    expect((board as HTMLElement | null)?.style.getPropertyValue('--board-square-light')).toBe('#FFFFDD');

    // eslint-disable-next-line fp/no-delete
    delete (Element.prototype as Partial<Element> & { getAnimations?: () => Array<Animation> }).getAnimations;
  });

  it('renders the gchessboard wrapper, reports a controller, and toggles orientation from the button', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    localStorage.clear();

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
    const buttons = root.querySelectorAll('button[type="button"]');
    const toggleButton = buttons.item(0) as HTMLButtonElement | null;
    const coordinatesToggle = root.querySelector(
      'button[aria-label="Toggle Board Coordinates"]'
    ) as HTMLButtonElement | null;
    const colorSchemeToggle = root.querySelector(
      'button[aria-label="Toggle Board Color Scheme"]'
    ) as HTMLButtonElement | null;
    const board = root.querySelector('g-chess-board') as { coordinates?: string; orientation?: string } | null;

    expect(controller).toBeDefined();
    expect(toggleButton?.textContent).toContain('Flip');
    expect(coordinatesToggle?.textContent).toContain('a1');
    expect(colorSchemeToggle).not.toBeNull();
    expect(colorSchemeToggle?.style.backgroundColor).toBe('rgb(102, 136, 85)');
    expect(board?.coordinates).toBe('outside');
    expect(board?.orientation).toBe('white');
    expect((board as HTMLElement | null)?.style.getPropertyValue('--board-border-color')).toBe('#668855');
    expect((board as HTMLElement | null)?.style.getPropertyValue('--board-square-light')).toBe('#EFF1EE');
    expect((board as HTMLElement | null)?.style.getPropertyValue('--board-square-dark')).toBe('#668855');

    toggleButton?.click();
    await Promise.resolve();

    expect(board?.orientation).toBe('black');

    coordinatesToggle?.click();
    await Promise.resolve();

    expect(coordinatesToggle?.textContent).toContain('a1');
    expect(board?.coordinates).toBe('hidden');

    colorSchemeToggle?.click();
    await Promise.resolve();

    expect(colorSchemeToggle?.style.backgroundColor).toBe('rgb(181, 136, 99)');
    expect((board as HTMLElement | null)?.style.getPropertyValue('--board-border-color')).toBe('#886649');
    expect((board as HTMLElement | null)?.style.getPropertyValue('--board-square-light')).toBe('#FFFFDD');
    expect((board as HTMLElement | null)?.style.getPropertyValue('--board-square-dark')).toBe('#B58863');

    // eslint-disable-next-line fp/no-delete
    delete (Element.prototype as Partial<Element> & { getAnimations?: () => Array<Animation> }).getAnimations;
  });

  it('reapplies the highlighted move when the board orientation changes', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    localStorage.clear();

    const getAnimationsSpy = vi.fn(() => []);
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: getAnimationsSpy,
    });

    const [orientation, setOrientation] = createSignal<GameBoardOrientation>(GAME_BOARD_ORIENTATION_WHITE);
    const onReady = vi.fn();

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

    const controller = onReady.mock.calls[0]?.[0] as ChessBoardController | undefined;
    const board = root.querySelector('g-chess-board') as HTMLElement | null;

    if (!controller || !board) {
      throw new Error('Expected board controller and element to be available.');
    }

    const fromSquare = document.createElement('div');
    fromSquare.setAttribute('data-square', 'e2');
    const toSquare = document.createElement('div');
    toSquare.setAttribute('data-square', 'e4');
    const shadowRoot = board.shadowRoot ?? board.attachShadow({ mode: 'open' });

    const querySelector = (selector: string): Element | null => {
      if (selector === '[data-square="e2"]') {
        return fromSquare;
      }

      if (selector === '[data-square="e4"]') {
        return toSquare;
      }

      return null;
    };
    const querySelectorAll = (): NodeListOf<Element> => {
      const matchingSquares = [fromSquare, toSquare].filter((square) => square.hasAttribute('last-move'));

      return {
        entries: () => matchingSquares.entries(),
        forEach: matchingSquares.forEach.bind(matchingSquares),
        item: (index: number) => matchingSquares[index] ?? null,
        keys: () => matchingSquares.keys(),
        length: matchingSquares.length,
        values: () => matchingSquares.values(),
        [Symbol.iterator]: matchingSquares[Symbol.iterator].bind(matchingSquares),
      } as unknown as NodeListOf<Element>;
    };

    Object.defineProperty(shadowRoot, 'querySelector', {
      configurable: true,
      value: querySelector,
    });
    Object.defineProperty(shadowRoot, 'querySelectorAll', {
      configurable: true,
      value: querySelectorAll,
    });

    controller.renderPosition(START_FEN, ['e2', 'e4']);
    expect(fromSquare.hasAttribute('last-move')).toBe(true);
    expect(toSquare.hasAttribute('last-move')).toBe(true);

    fromSquare.removeAttribute('last-move');
    toSquare.removeAttribute('last-move');

    setOrientation('black');
    await Promise.resolve();

    expect(fromSquare.hasAttribute('last-move')).toBe(true);
    expect(toSquare.hasAttribute('last-move')).toBe(true);

    // eslint-disable-next-line fp/no-delete
    delete (Element.prototype as Partial<Element> & { getAnimations?: () => Array<Animation> }).getAnimations;
  });
});
