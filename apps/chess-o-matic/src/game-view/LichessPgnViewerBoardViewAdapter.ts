import { Chessground } from '@lichess-org/chessground';
import LichessPgnViewer from '@lichess-org/pgn-viewer';

import type { BoardViewAdapter, Coord } from './types';

export const LichessPgnViewerBoardViewAdapter: BoardViewAdapter = (boardEl: HTMLElement) => {
  const cgEl = document.createElement('div');
  const pgnVEl = document.createElement('div');
  boardEl.appendChild(cgEl);
  boardEl.appendChild(pgnVEl);

  const cg = Chessground(cgEl, {
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

  const rep = LichessPgnViewer(pgnVEl, {});
  rep.setGround(cg);

  return {
    move: (orig: Coord, dest: Coord, _fen: string) => cg.move(orig, dest),
    toggleOrientation: rep.flip,
  };
};
