import 'gchessboard';
import './gchessboard.css';

import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';
import { RotateCw } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';

import type { GameBoardOrientation } from '../../../../domain/game/types';
import type { ChessBoardController } from './controller';

type ChessBoardProps = {
  readonly fen: string;
  readonly isLegalMove: (coords: [Square, Square]) => boolean;
  readonly getPromotionPieceColor: (coords: [Square, Square]) => 'b' | 'w' | undefined;
  readonly onMove: (move: [Square, Square] | string) => Promise<void> | void;
  readonly onReady: (controller: ChessBoardController | undefined) => void;
  readonly onToggleOrientation: () => void;
  readonly orientation: GameBoardOrientation;
};

const BOARD_COLOR_SCHEME_GREEN = 'green' as const;
const BOARD_COLOR_SCHEME_BROWN = 'brown' as const;
type BoardColorScheme = typeof BOARD_COLOR_SCHEME_GREEN | typeof BOARD_COLOR_SCHEME_BROWN;
const BOARD_COLOR_SCHEME_STORAGE_KEY = 'chess-o-matic-3000/ui/board-color-scheme';
const BOARD_COORDINATES_STORAGE_KEY = 'chess-o-matic-3000/ui/board-coordinates-visible';

const BOARD_COLOR_SCHEMES: Record<BoardColorScheme, { border: string; dark: string; label: string; light: string }> = {
  brown: {
    border: '#886649',
    dark: '#B58863',
    label: 'Brown/Beige',
    light: '#FFFFDD',
  },
  green: {
    border: '#668855',
    dark: '#668855',
    label: 'Green/White',
    light: '#EFF1EE',
  },
} as const;

export function ChessBoard(props: ChessBoardProps): JSX.Element {
  let boardEl: GChessBoardElement | undefined;
  let promotionDialogEl: HTMLDivElement | undefined;
  let lastHighlightedMove: [Square, Square] | undefined;

  function loadStoredBoardColorScheme(): BoardColorScheme {
    if (typeof localStorage === 'undefined') {
      return BOARD_COLOR_SCHEME_GREEN;
    }

    const storedValue = localStorage.getItem(BOARD_COLOR_SCHEME_STORAGE_KEY);
    return storedValue === BOARD_COLOR_SCHEME_BROWN ? BOARD_COLOR_SCHEME_BROWN : BOARD_COLOR_SCHEME_GREEN;
  }

  function loadStoredBoardCoordinatesVisible(): boolean {
    if (typeof localStorage === 'undefined') {
      return true;
    }

    const storedValue = localStorage.getItem(BOARD_COORDINATES_STORAGE_KEY);
    return storedValue === null ? true : storedValue === 'true';
  }

  const [colorScheme, setColorScheme] = createSignal<BoardColorScheme>(loadStoredBoardColorScheme());
  const [showCoordinates, setShowCoordinates] = createSignal(loadStoredBoardCoordinatesVisible());

  function clearMoveHighlight(board: GChessBoardElement): void {
    board.shadowRoot?.querySelectorAll('[last-move]')?.forEach((square) => square.removeAttribute('last-move'));
  }

  function moveHighlight(board: GChessBoardElement, coords: [Square, Square]): void {
    const [from, to] = coords;

    clearMoveHighlight(board);

    const fromSquare = board.shadowRoot?.querySelector(`[data-square="${from}"]`);
    const toSquare = board.shadowRoot?.querySelector(`[data-square="${to}"]`);

    if (fromSquare) {
      fromSquare.setAttribute('last-move', '');
    }

    if (toSquare) {
      toSquare.setAttribute('last-move', '');
    }
  }

  function setBoardTurnFromFen(board: GChessBoardElement, fen: string): void {
    board.turn = fen.split(' ')[1] === 'w' ? 'white' : 'black';
  }

  function applyBoardColorScheme(board: GChessBoardElement, scheme: BoardColorScheme): void {
    const palette = BOARD_COLOR_SCHEMES[scheme];

    board.style.setProperty('--board-border-color', palette.border);
    board.style.setProperty('--board-square-light', palette.light);
    board.style.setProperty('--board-square-dark', palette.dark);
    board.style.setProperty('--inner-border-color', palette.border);
  }

  function applyBoardCoordinates(board: GChessBoardElement, visible: boolean): void {
    board.coordinates = visible ? 'outside' : 'hidden';
  }

  async function syncBoardMove(board: GChessBoardElement, move: [Square, Square] | string): Promise<void> {
    await props.onMove(move);
  }

  function openPromotionDialog(
    board: GChessBoardElement,
    dialog: HTMLDivElement,
    coords: [Square, Square],
    color: 'b' | 'w'
  ): void {
    dialog.setAttribute('data-open', 'true');

    const choices = dialog.querySelectorAll<HTMLButtonElement>('.promo-choice');
    choices.forEach((element) => {
      const role = element.dataset.piece;
      if (!role) {
        return;
      }

      element.className = `promo-choice ${color === 'w' ? 'white-' : 'black-'}${role}`;
      element.onclick = async (): Promise<void> => {
        dialog.setAttribute('data-open', 'false');

        const san = coords[0].startsWith(coords[1][0])
          ? `${coords[1]}=${role.toUpperCase()}`
          : `${coords[0][0]}x${coords[1]}=${role.toUpperCase()}`;

        await syncBoardMove(board, san);
      };
    });
  }

  onMount(() => {
    if (!boardEl || !promotionDialogEl) {
      props.onReady(undefined);
      return;
    }

    const board = boardEl;
    const dialog = promotionDialogEl;

    applyBoardCoordinates(board, showCoordinates());
    board.interactive = true;
    board.fen = props.fen;
    board.orientation = props.orientation;
    applyBoardColorScheme(board, colorScheme());
    setBoardTurnFromFen(board, props.fen);

    const highlightStyle = document.createElement('style');
    highlightStyle.textContent = `
      [data-square][data-square-color="light"] {
        background-color: var(--board-square-light, #EFF1EE) !important;
      }
      [data-square][data-square-color="dark"] {
        background-color: var(--board-square-dark, #668855) !important;
      }
      [data-square][data-square-color="light"][last-move] {
        background-color: rgba(205, 210, 106, 0.8) !important;
      }
      [data-square][data-square-color="dark"][last-move] {
        background-color: rgba(170, 162, 58, 0.8) !important;
      }
    `;

    requestAnimationFrame(() => {
      board.shadowRoot?.appendChild(highlightStyle);
    });

    function handleMoveEnd(event: Event): void {
      const customEvent = event as CustomEvent<{ from: Square; to: Square }>;
      const coords: [Square, Square] = [customEvent.detail.from, customEvent.detail.to];

      if (!props.isLegalMove(coords)) {
        event.preventDefault();
        return;
      }

      const promotionColor = props.getPromotionPieceColor(coords);
      if (promotionColor) {
        event.preventDefault();
        openPromotionDialog(board, dialog, coords, promotionColor);
      }
    }

    async function handleMoveFinished(event: Event): Promise<void> {
      const customEvent = event as CustomEvent<{ from: Square; to: Square }>;
      const coords: [Square, Square] = [customEvent.detail.from, customEvent.detail.to];

      if (props.isLegalMove(coords)) {
        await syncBoardMove(board, coords);
      }
    }

    board.addEventListener('moveend', handleMoveEnd);
    board.addEventListener('movefinished', handleMoveFinished);

    props.onReady({
      renderPosition(fen: string, lastMove?: [Square, Square]): void {
        board.fen = fen;
        lastHighlightedMove = lastMove;
        if (lastMove) {
          moveHighlight(board, lastMove);
        } else {
          clearMoveHighlight(board);
        }
        setBoardTurnFromFen(board, fen);
      },
    });

    onCleanup(() => {
      props.onReady(undefined);
      board.removeEventListener('moveend', handleMoveEnd);
      board.removeEventListener('movefinished', handleMoveFinished);
      highlightStyle.remove();
    });
  });

  createEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BOARD_COLOR_SCHEME_STORAGE_KEY, colorScheme());
    }

    if (!boardEl) {
      return;
    }

    applyBoardColorScheme(boardEl, colorScheme());
  });

  createEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BOARD_COORDINATES_STORAGE_KEY, JSON.stringify(showCoordinates()));
    }

    if (!boardEl) {
      return;
    }

    applyBoardCoordinates(boardEl, showCoordinates());
  });

  createEffect(() => {
    if (!boardEl) {
      return;
    }

    boardEl.orientation = props.orientation;
    if (lastHighlightedMove) {
      moveHighlight(boardEl, lastHighlightedMove);
      return;
    }

    clearMoveHighlight(boardEl);
  });

  return (
    <div class="board-panel">
      <div class="board-frame relative">
        <g-chess-board
          class="block aspect-square w-full max-w-[34rem] border-2 border-[var(--board-border-color)]"
          id="board"
          ref={boardEl}
        />
        <div
          class="promotion-dialog absolute inset-0 hidden items-center justify-center bg-black/30 data-[open=true]:flex"
          data-open="false"
          id="promotion-dialog"
          ref={promotionDialogEl}
        >
          <div class="promotion-surface">
            <button
              class="promo-choice promotion-choice"
              data-piece="q"
              title="Queen"
              type="button"
            />
            <button
              class="promo-choice promotion-choice"
              data-piece="r"
              title="Rook"
              type="button"
            />
            <button
              class="promo-choice promotion-choice"
              data-piece="b"
              title="Bishop"
              type="button"
            />
            <button
              class="promo-choice promotion-choice"
              data-piece="n"
              title="Knight"
              type="button"
            />
          </div>
        </div>
      </div>

      <div class="board-toolbar">
        <button class="toolbar-button toolbar-button-cobalt" onClick={props.onToggleOrientation} type="button">
          <RotateCw class="h-4 w-4" />
          <span>Flip</span>
        </button>

        <button
          aria-label="Toggle Board Coordinates"
          class="toolbar-button toolbar-button-cobalt"
          onClick={() => setShowCoordinates((current) => !current)}
          type="button"
        >
          <span class={showCoordinates() ? '[font-family:var(--font-data)]' : '[font-family:var(--font-data)] line-through'}>
            a1
          </span>
        </button>

        <button
          aria-label="Toggle Board Color Scheme"
          class="board-swatch-button toolbar-icon-button-cobalt"
          onClick={() =>
            setColorScheme((current) =>
              current === BOARD_COLOR_SCHEME_GREEN ? BOARD_COLOR_SCHEME_BROWN : BOARD_COLOR_SCHEME_GREEN
            )
          }
          style={{
            'background-color': BOARD_COLOR_SCHEMES[colorScheme()].dark,
            'border-color': 'var(--board-border-color)',
          }}
          title={`Board colors: ${BOARD_COLOR_SCHEMES[colorScheme()].label}`}
          type="button"
        />
      </div>
    </div>
  );
}
