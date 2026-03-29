import type { Move, Square } from 'chess.js';
import { Chess } from 'chess.js';

import type { GameModelEvent, GameModelEventListener, GameModelEventType } from './events.js';
import { gameModelEventsEmptyListeners } from './events.js';
import type { ChessMoveSafe, IsLegalMove } from './extras.js';
import { chessMoveSafe } from './extras.js';
import { chessIsLegalMove } from './extras.js';

// --------------------------------------------------------------------------
export type GameHistoryMove = {
  readonly from: Square;
  readonly san: string;
  readonly to: Square;
};

export type GameModelResources = {
  chess: Chess;
  isLegalMove: IsLegalMove;
  chessMoveSafe: ChessMoveSafe;
  readonly listeners: Map<GameModelEventType, Set<GameModelEventListener<GameModelEvent>>>;
  moveHistory: Array<GameHistoryMove>;
  currentPly: number;
  locked: boolean;
};

function syncGameModelChess(gameModelResources: GameModelResources): void {
  gameModelResources.isLegalMove = chessIsLegalMove(gameModelResources.chess);
  gameModelResources.chessMoveSafe = chessMoveSafe(gameModelResources.chess);
}

function rebuildGameModelChess(gameModelResources: GameModelResources): void {
  const chess = new Chess();

  gameModelResources.moveHistory.slice(0, gameModelResources.currentPly).forEach((move) => {
    chess.move(move.san);
  });

  gameModelResources.chess = chess;
  syncGameModelChess(gameModelResources);
}

export function gameModelPushHistoryMove(gameModelResources: GameModelResources, move: Move): void {
  if (gameModelResources.currentPly < gameModelResources.moveHistory.length) {
    gameModelResources.moveHistory = gameModelResources.moveHistory.slice(0, gameModelResources.currentPly);
  }

  gameModelResources.moveHistory.push({
    from: move.from,
    san: move.san,
    to: move.to,
  });
  gameModelResources.currentPly = gameModelResources.moveHistory.length;
}

export function gameModelCanGoBackward(gameModelResources: GameModelResources): boolean {
  return gameModelResources.currentPly > 0;
}

export function gameModelCanGoForward(gameModelResources: GameModelResources): boolean {
  return gameModelResources.currentPly < gameModelResources.moveHistory.length;
}

export function gameModelGoToStart(gameModelResources: GameModelResources): void {
  gameModelResources.currentPly = 0;
  rebuildGameModelChess(gameModelResources);
}

export function gameModelStepBackward(gameModelResources: GameModelResources): void {
  if (!gameModelCanGoBackward(gameModelResources)) {
    return;
  }

  gameModelResources.currentPly -= 1;
  rebuildGameModelChess(gameModelResources);
}

export function gameModelStepForward(gameModelResources: GameModelResources): void {
  if (!gameModelCanGoForward(gameModelResources)) {
    return;
  }

  gameModelResources.currentPly += 1;
  rebuildGameModelChess(gameModelResources);
}

export function gameModelGoToEnd(gameModelResources: GameModelResources): void {
  gameModelResources.currentPly = gameModelResources.moveHistory.length;
  rebuildGameModelChess(gameModelResources);
}

export function gameModelCurrentMove(gameModelResources: GameModelResources): GameHistoryMove | undefined {
  return gameModelResources.moveHistory.at(gameModelResources.currentPly - 1);
}

// --------------------------------------------------------------------------
export async function initGameModel(): Promise<GameModelResources> {
  const chess = new Chess();

  return {
    chess,
    isLegalMove: chessIsLegalMove(chess),
    chessMoveSafe: chessMoveSafe(chess),
    listeners: gameModelEventsEmptyListeners(),
    moveHistory: [],
    currentPly: 0,
    locked: false,
  };
}

// --------------------------------------------------------------------------
export async function exitGameModel(_gameModelResources: GameModelResources): Promise<void> {
  return;
}
