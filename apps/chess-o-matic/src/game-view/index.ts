import type { GameModelResources } from '../game-model';
import type { GameModelEvaluateResultControl, GameModelEvaluateResultOk } from '../game-model/evaluate';
import { GAME_MODEL_CONTROL_ACTION_FLIP } from '../game-model/evaluate';
import { GchessboardBoardViewAdapter } from './GchessboardBoardViewAdapter';
import type { BoardView } from './types';

// --------------------------------------------------------------------------
export type GameViewResources = {
  readonly board: BoardView;
  readonly inputEl: HTMLElement;
  readonly pgnEl: HTMLElement;
};

// --------------------------------------------------------------------------
export function initGameView(
  gameModelResources: GameModelResources,
  boardEl: HTMLElement,
  inputEl: HTMLElement,
  pgnEl: HTMLElement
): GameViewResources {
  return {
    board: GchessboardBoardViewAdapter(gameModelResources, boardEl),
    inputEl,
    pgnEl,
  };
}

// --------------------------------------------------------------------------
export function gameViewUpdateMoved(
  gameViewResources: GameViewResources,
  gameModelResources: GameModelResources,
  evaluateResult: GameModelEvaluateResultOk
): void {
  if (gameModelResources.locked) {
    return;
  }
  gameViewResources.board.move([evaluateResult.move[0], evaluateResult.move[1]], gameModelResources.chess.fen());
}

// --------------------------------------------------------------------------
export function gameViewUpdateControl(
  gameViewResources: GameViewResources,
  gameModelResources: GameModelResources,
  evaluateResult: GameModelEvaluateResultControl
): void {
  if (gameModelResources.locked) {
    return;
  }

  switch (evaluateResult.action) {
    case GAME_MODEL_CONTROL_ACTION_FLIP:
      gameViewResources.board.toggleOrientation();
      break;
  }
}

// --------------------------------------------------------------------------
export function exitGameView(_gameViewResource: GameViewResources): void {
  return;
}
