import type { Square } from 'chess.js';

import type { GameModelResources } from '../game-model';

export type BoardView = {
  readonly move: (coords: [Square, Square], fen: string) => void;
  readonly toggleOrientation: () => void;
};

export type BoardViewAdapter = (gameModelResources: GameModelResources, boardEl: HTMLElement) => BoardView;
