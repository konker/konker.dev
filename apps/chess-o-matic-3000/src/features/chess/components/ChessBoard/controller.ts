import type { Square } from 'chess.js';

export const BOARD_COLOR_LIGHT = 'light' as const;
export const BOARD_COLOR_DARK = 'dark' as const;

export type BoardColor = typeof BOARD_COLOR_LIGHT | typeof BOARD_COLOR_DARK;

export type ChessBoardController = {
  readonly renderPosition: (fen: string, lastMove?: [Square, Square]) => void;
  readonly toggleOrientation: () => void;
  readonly orientation: () => BoardColor;
};
