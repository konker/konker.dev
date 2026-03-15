import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';

import { Chessground } from '@lichess-org/chessground';

import type { BoardViewAdapter, Coord } from './types';

export const ChessgroundBoardViewAdapter: BoardViewAdapter = (boardEl: HTMLElement) => {
  const rep = Chessground(boardEl, {
    orientation: 'white',
    coordinatesOnSquares: true,
    movable: { free: false },
    premovable: { enabled: false },
    predroppable: { enabled: false },
    highlight: { lastMove: true },
    selectable: { enabled: false },
    draggable: { enabled: false },
    drawable: { enabled: false },
  });

  return {
    move: (orig: Coord, dest: Coord, _fen: string) => rep.move(orig, dest),
    toggleOrientation: rep.toggleOrientation,
  };
};
