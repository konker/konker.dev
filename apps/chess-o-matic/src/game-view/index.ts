import type { GameModelHandleInputResult, GameModelResources } from '../game-model';
import {
  GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL,
  GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE,
  GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL,
  GAME_MODEL_HANDLE_INPUT_STATUS_OK,
} from '../game-model';
import { ChessboardElementBoardViewAdapter } from './ChessboardElementBoardViewAdapter';
import { ChessgroundBoardViewAdapter } from './ChessgroundBoardViewAdapter';
import { GchessboardBoardViewAdapter } from './GchessboardBoardViewAdapter';
import type { BoardView } from './types';

export type GameViewResources = {
  readonly board: BoardView;
  readonly inputEl: HTMLElement;
  readonly pgnEl: HTMLElement;
};

export function initGameView(boardEl: HTMLElement, inputEl: HTMLElement, pgnEl: HTMLElement): GameViewResources {
  return {
    // board: ChessboardElementBoardViewAdapter(boardEl),
    board: GchessboardBoardViewAdapter(boardEl),
    // board: ChessgroundBoardViewAdapter(boardEl),
    inputEl,
    pgnEl,
  };
}

export function handleGameViewUpdate(
  gameViewResources: GameViewResources,
  gameModelResources: GameModelResources,
  handleInputResult: GameModelHandleInputResult
): GameViewResources {
  switch (handleInputResult.status) {
    case GAME_MODEL_HANDLE_INPUT_STATUS_OK: {
      gameViewResources.board.move(
        handleInputResult.move[0],
        handleInputResult.move[1],
        gameModelResources.chess.fen()
      );
      gameViewResources.inputEl.innerHTML = handleInputResult.sanitized;
      gameViewResources.pgnEl.innerHTML = gameModelResources.chess.pgn();
      return gameViewResources;
    }
    case GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL: {
      switch (handleInputResult.action) {
        case '_flip':
          gameViewResources.board.toggleOrientation();
          gameViewResources.inputEl.innerHTML = handleInputResult.sanitized;
          return gameViewResources;
      }
      return gameViewResources;
    }
    case GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL: {
      gameViewResources.inputEl.innerHTML = handleInputResult.sanitized;
      return gameViewResources;
    }
    case GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE: {
      gameViewResources.inputEl.innerHTML = handleInputResult.sanitized;
      return gameViewResources;
    }
  }
}

export function exitGameView(_gameViewResource: GameViewResources): void {
  return;
}
