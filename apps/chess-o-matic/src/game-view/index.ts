import type { GameModelResources } from '../game-model';
import type { GameModelEvaluateResult } from '../game-model/evaluate';
import {
  GAME_MODEL_EVALUATE_STATUS_CONTROL,
  GAME_MODEL_EVALUATE_STATUS_IGNORE,
  GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
  GAME_MODEL_EVALUATE_STATUS_OK,
} from '../game-model/evaluate';
import { GchessboardBoardViewAdapter } from './GchessboardBoardViewAdapter';
import type { BoardView } from './types';

export type GameViewResources = {
  readonly board: BoardView;
  readonly inputEl: HTMLElement;
  readonly pgnEl: HTMLElement;
};

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

export function gameViewUpdate(
  gameViewResources: GameViewResources,
  gameModelResources: GameModelResources,
  evaluateResult: GameModelEvaluateResult
): GameViewResources {
  switch (evaluateResult.status) {
    case GAME_MODEL_EVALUATE_STATUS_OK: {
      gameViewResources.board.move([evaluateResult.move[0], evaluateResult.move[1]], gameModelResources.chess.fen());
      gameViewResources.inputEl.innerHTML = evaluateResult.sanitized;
      gameViewResources.pgnEl.innerHTML = gameModelResources.chess.pgn();
      return gameViewResources;
    }
    case GAME_MODEL_EVALUATE_STATUS_CONTROL: {
      switch (evaluateResult.action) {
        case '_flip':
          gameViewResources.board.toggleOrientation();
          gameViewResources.inputEl.innerHTML = evaluateResult.sanitized;
          return gameViewResources;
      }
      return gameViewResources;
    }
    case GAME_MODEL_EVALUATE_STATUS_ILLEGAL: {
      gameViewResources.inputEl.innerHTML = evaluateResult.sanitized;
      return gameViewResources;
    }
    case GAME_MODEL_EVALUATE_STATUS_IGNORE: {
      gameViewResources.inputEl.innerHTML = evaluateResult.sanitized;
      return gameViewResources;
    }
  }
}

export function exitGameView(_gameViewResource: GameViewResources): void {
  return;
}
