import { Chess } from 'chess.js';

import type { GameModelEvent, GameModelEventListener, GameModelEventType } from './events';
import { gameModelEventsEmptyListeners } from './events';
import type { IsLegalMove } from './extras';
import { chessIsLegalMove } from './extras';

// --------------------------------------------------------------------------
export type GameModelResources = {
  readonly chess: Chess;
  readonly isLegalMove: IsLegalMove;
  readonly listeners: Map<GameModelEventType, Set<GameModelEventListener<GameModelEvent>>>;
};

// --------------------------------------------------------------------------
export function initGameModel(): GameModelResources {
  const chess = new Chess();

  return {
    chess,
    isLegalMove: chessIsLegalMove(chess),
    listeners: gameModelEventsEmptyListeners(),
  };
}

// --------------------------------------------------------------------------
export function exitGameModel(_gameModelResources: GameModelResources): void {
  return;
}
