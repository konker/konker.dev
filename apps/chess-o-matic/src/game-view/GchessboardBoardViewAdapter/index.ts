import 'gchessboard';
import './styles.css';

import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';

import type { GameModelResources } from '../../game-model';
import { START_FEN } from '../../game-model/consts';
import type { BoardViewAdapter } from '../types';
import { moveComplete, moveHighlight } from './helpers';
import { openPromotionDialog } from './promotion-ui';

// --------------------------------------------------------------------------
export const GchessboardBoardViewAdapter: BoardViewAdapter = (
  gameModelResources: GameModelResources,
  _boardEl: HTMLElement
) => {
  const rep = document.getElementById('board') as GChessBoardElement;
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

  rep.addEventListener('moveend', (e) => {
    const coords: [Square, Square] = [e.detail.from, e.detail.to];
    if (!gameModelResources.isLegalMove(coords)) {
      console.log('KONK81', 'illegal', e.detail);
      rep.fen = gameModelResources.chess.fen();
      return e.preventDefault();
    }

    const piece = gameModelResources.chess.get(coords[0]);
    const isPawn = piece?.type === 'p';
    const isPromotionRank = coords[1].endsWith('8') || coords[1].endsWith('1');

    console.log('KONK80000', coords, piece, isPawn, isPromotionRank);
    if (isPawn && isPromotionRank) {
      gameModelResources.locked = true;
      rep.fen = gameModelResources.chess.fen();
      e.preventDefault();
      openPromotionDialog(gameModelResources, rep, coords, piece.color);
    }
  });

  rep.addEventListener('movefinished', (e) => {
    const coords: [Square, Square] = [e.detail.from, e.detail.to];
    console.log('KONK82', coords);
    moveComplete(gameModelResources, rep, coords, `${coords[0]}-${coords[1]}`);
  });

  return {
    move: (coords: [Square, Square], fen: string) => {
      rep.fen = fen;
      moveHighlight(rep, coords);
      rep.turn = gameModelResources.chess.turn() === 'w' ? 'white' : 'black';
    },
    toggleOrientation: () => {
      rep.orientation = rep.orientation === 'white' ? 'black' : 'white';
    },
  };
};
