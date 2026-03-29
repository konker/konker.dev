import type { Square } from 'chess.js';

export const BOARD_COLOR_LIGHT = 'light' as const;
export const BOARD_COLOR_DARK = 'dark' as const;

export type BoardColor = typeof BOARD_COLOR_LIGHT | typeof BOARD_COLOR_DARK;

export type ChessBoardController = {
  readonly move: (coords: [Square, Square], fen: string) => void;
  readonly toggleOrientation: () => void;
  readonly orientation: () => BoardColor;
};
