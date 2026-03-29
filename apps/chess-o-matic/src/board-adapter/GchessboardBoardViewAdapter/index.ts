import 'gchessboard';
import './styles.css';

import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';

import type { GameModelResources } from '../../game-model';
import { START_FEN } from '../../game-model/consts.js';
import type { BoardAdapterMountElements, BoardViewAdapter } from '../types.js';
import { BOARD_COLOR_DARK } from '../types.js';
import { BOARD_COLOR_LIGHT } from '../types.js';
import { moveComplete, moveHighlight } from './helpers.js';
import { openPromotionDialog } from './promotion-ui.js';

// --------------------------------------------------------------------------
export const GchessboardBoardViewAdapter: BoardViewAdapter = function GchessboardBoardViewAdapter(
  gameModelResources: GameModelResources,
  elements: BoardAdapterMountElements
): ReturnType<BoardViewAdapter> {
  const rep = elements.boardEl as GChessBoardElement;
  rep.coordinates = 'outside';
  rep.turn = 'white';
  rep.interactive = true;
  rep.fen = START_FEN;

  // Inject last-move highlight styles into the shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    [data-square][data-square-color="light"][last-move] {
      background-color: rgba(205, 210, 106, 0.8) !important;
    }
    [data-square][data-square-color="dark"][last-move] {
      background-color: rgba(170, 162, 58, 0.8) !important;
    }
  `;
  requestAnimationFrame(() => {
    rep.shadowRoot?.appendChild(style);
  });

  function handleMoveEnd(e: Event): void {
    const customEvent = e as CustomEvent<{ from: Square; to: Square }>;
    const coords: [Square, Square] = [customEvent.detail.from, customEvent.detail.to];
    if (!gameModelResources.isLegalMove(coords)) {
      rep.fen = gameModelResources.chess.fen();
      e.preventDefault();
      return;
    }

    const piece = gameModelResources.chess.get(coords[0]);
    const isPawn = piece?.type === 'p';
    const isPromotionRank = coords[1].endsWith('8') || coords[1].endsWith('1');

    if (isPawn && isPromotionRank) {
      gameModelResources.locked = true;
      rep.fen = gameModelResources.chess.fen();
      e.preventDefault();
      openPromotionDialog(gameModelResources, rep, elements.promotionDialogEl, coords, piece.color);
    }
  }

  async function handleMoveFinished(e: Event): Promise<void> {
    const customEvent = e as CustomEvent<{ from: Square; to: Square }>;
    const coords: [Square, Square] = [customEvent.detail.from, customEvent.detail.to];
    if (gameModelResources.isLegalMove(coords)) {
      await moveComplete(gameModelResources, rep, coords, `${coords[0]}-${coords[1]}`);
    }
  }

  rep.addEventListener('moveend', handleMoveEnd);
  rep.addEventListener('movefinished', handleMoveFinished);

  return {
    move(coords: [Square, Square], fen: string): void {
      rep.fen = fen;
      moveHighlight(rep, coords);
      rep.turn = gameModelResources.chess.turn() === 'w' ? 'white' : 'black';
    },
    toggleOrientation(): void {
      rep.orientation = rep.orientation === 'white' ? 'black' : 'white';
    },
    orientation(): typeof BOARD_COLOR_LIGHT | typeof BOARD_COLOR_DARK {
      return rep.orientation == 'white' ? BOARD_COLOR_LIGHT : BOARD_COLOR_DARK;
    },
    dispose(): void {
      rep.removeEventListener('moveend', handleMoveEnd);
      rep.removeEventListener('movefinished', handleMoveFinished);
      style.remove();
    },
  };
};
