import { Chess } from 'chess.js';

import type { GameModelEvent, GameModelEventListener, GameModelEventType } from './events.js';
import { gameModelEventsEmptyListeners } from './events.js';
import type { ChessMoveSafe, IsLegalMove } from './extras.js';
import { chessMoveSafe } from './extras.js';
import { chessIsLegalMove } from './extras.js';

// --------------------------------------------------------------------------
export type GameModelResources = {
  readonly chess: Chess;
  readonly isLegalMove: IsLegalMove;
  readonly chessMoveSafe: ChessMoveSafe;
  readonly listeners: Map<GameModelEventType, Set<GameModelEventListener<GameModelEvent>>>;
  locked: boolean;
};

// --------------------------------------------------------------------------
export function initGameModel(): GameModelResources {
  const chess = new Chess();

  return {
    chess,
    isLegalMove: chessIsLegalMove(chess),
    chessMoveSafe: chessMoveSafe(chess),
    listeners: gameModelEventsEmptyListeners(),
    locked: false,
  };
}

// --------------------------------------------------------------------------
export function exitGameModel(_gameModelResources: GameModelResources): void {
  return;
}
