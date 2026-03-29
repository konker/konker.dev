import type { Square } from 'chess.js';

export type ChessBoardController = {
  readonly renderPosition: (fen: string, lastMove?: [Square, Square]) => void;
};
