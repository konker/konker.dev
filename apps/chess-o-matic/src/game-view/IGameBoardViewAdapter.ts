import type { Square } from 'chess.js';

export type OnMoveEventListener = (orig: Square, dest: Square) => void;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface IGameBoardViewAdapter {
  move: (coords: [Square, Square], fen: string) => void;
  toggleOrientation: () => void;
  addOnMoveEventListener: (listener: OnMoveEventListener) => void;
  removeAllOnMoveEventListeners: () => void;
  notifyOnMove: (orig: Square, dest: Square) => void;
}
