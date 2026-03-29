import 'gchessboard';
import './gchessboard.css';

import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';
import type { JSX } from 'solid-js';
import { onCleanup, onMount } from 'solid-js';

import type { ChessBoardController } from './controller';
import { BOARD_COLOR_DARK, BOARD_COLOR_LIGHT } from './controller';

type ChessBoardProps = {
  readonly isLegalMove: (coords: [Square, Square]) => boolean;
  readonly getPromotionPieceColor: (coords: [Square, Square]) => 'b' | 'w' | undefined;
  readonly onMove: (move: [Square, Square] | string) => Promise<void> | void;
  readonly onReady: (controller: ChessBoardController | undefined) => void;
};

export function ChessBoard(props: ChessBoardProps): JSX.Element {
  let boardEl: GChessBoardElement | undefined;
  let promotionDialogEl: HTMLDivElement | undefined;

  function moveHighlight(board: GChessBoardElement, coords: [Square, Square]): void {
    const [from, to] = coords;

    board.shadowRoot?.querySelectorAll('[last-move]')?.forEach((square) => square.removeAttribute('last-move'));

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

    board.coordinates = 'outside';
    board.turn = 'white';
    board.interactive = true;

    const highlightStyle = document.createElement('style');
    highlightStyle.textContent = `
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
      move(coords: [Square, Square], fen: string): void {
        board.fen = fen;
        moveHighlight(board, coords);
        setBoardTurnFromFen(board, fen);
      },
      toggleOrientation(): void {
        board.orientation = board.orientation === 'white' ? 'black' : 'white';
      },
      orientation() {
        return board.orientation === 'white' ? BOARD_COLOR_LIGHT : BOARD_COLOR_DARK;
      },
    });

    onCleanup(() => {
      props.onReady(undefined);
      board.removeEventListener('moveend', handleMoveEnd);
      board.removeEventListener('movefinished', handleMoveFinished);
      highlightStyle.remove();
    });
  });

  return (
    <div class="board-frame">
      <g-chess-board class="board" id="board" ref={boardEl} />
      <div class="promotion-dialog" data-open="false" id="promotion-dialog" ref={promotionDialogEl}>
        <div class="promotion-panel">
          <button class="promo-choice" data-piece="q" title="Queen" type="button" />
          <button class="promo-choice" data-piece="r" title="Rook" type="button" />
          <button class="promo-choice" data-piece="b" title="Bishop" type="button" />
          <button class="promo-choice" data-piece="n" title="Knight" type="button" />
        </div>
      </div>
    </div>
  );
}
