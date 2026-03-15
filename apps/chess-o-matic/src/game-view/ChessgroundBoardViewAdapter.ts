import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';

import { Chessground } from '@lichess-org/chessground';
import type { Square } from 'chess.js';

import type { GameModelResources } from '../game-model';
import type { BoardViewAdapter } from './types';

export const ChessgroundBoardViewAdapter: BoardViewAdapter = (
  _gameModelResources: GameModelResources,
  boardEl: HTMLElement
) => {
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
    move: (coords: [Square, Square], _fen: string) => rep.move(...coords),
    toggleOrientation: rep.toggleOrientation,
  };
};
