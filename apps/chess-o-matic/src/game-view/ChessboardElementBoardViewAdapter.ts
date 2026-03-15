import 'chessboard-element';

import type { ChessBoardElement } from 'chessboard-element';
import { START_FEN } from 'chessboard-element';

import type { BoardViewAdapter, Coord } from './types';

export const ChessboardElementBoardViewAdapter: BoardViewAdapter = (boardEl: HTMLElement) => {
  const rep = document.createElement('chess-board') as ChessBoardElement;
  rep.setPosition(START_FEN);
  rep.draggable = false;
  boardEl.replaceChildren(rep);

  return {
    move: (orig: Coord, dest: Coord, fen: string) => {
      rep.setPosition(fen);
    },
    toggleOrientation: () => (rep.orientation = rep.orientation === 'white' ? 'black' : 'white'),
  };
};
