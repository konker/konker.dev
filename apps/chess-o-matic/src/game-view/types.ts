import type { Square } from 'chess.js';

import type { GameModelResources } from '../game-model';

export const BOARD_COLOR_LIGHT = 'light' as const;
export const BOARD_COLOR_DARK = 'dark' as const;

export type BoardView = {
  readonly move: (coords: [Square, Square], fen: string) => void;
  readonly toggleOrientation: () => void;
  readonly orientation: () => typeof BOARD_COLOR_LIGHT | typeof BOARD_COLOR_DARK;
  readonly dispose: () => void;
};

export type BoardViewMountElements = {
  readonly boardEl: HTMLElement;
  readonly promotionDialogEl: HTMLElement;
};

export type BoardViewAdapter = (gameModelResources: GameModelResources, elements: BoardViewMountElements) => BoardView;
