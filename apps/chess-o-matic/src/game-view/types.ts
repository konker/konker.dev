import type { Square } from 'chess.js';

import type { GameModelResources } from '../game-model';

export const BOARD_COLOR_LIGHT = 'light' as const;
export const BOARD_COLOR_DARK = 'dark' as const;

export type BoardView = {
  readonly move: (coords: [Square, Square], fen: string) => void;
  readonly toggleOrientation: () => void;
  readonly orientation: () => typeof BOARD_COLOR_LIGHT | typeof BOARD_COLOR_DARK;
};

export type BoardViewAdapter = (gameModelResources: GameModelResources, boardEl: HTMLElement) => BoardView;
