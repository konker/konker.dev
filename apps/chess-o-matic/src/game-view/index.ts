import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';

import { Chessground } from '@lichess-org/chessground';

import type { GameModelHandleInputResult, GameModelResources } from '../game-model';
import {
  GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL,
  GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE,
  GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL,
  GAME_MODEL_HANDLE_INPUT_STATUS_OK,
} from '../game-model';

export type GameViewResources<T = ReturnType<typeof Chessground>> = {
  readonly board: T;
  readonly inputEl: HTMLElement;
  readonly pgnEl: HTMLElement;
};

export function initGameView(boardEl: HTMLElement, inputEl: HTMLElement, pgnEl: HTMLElement): GameViewResources {
  return {
    board: Chessground(boardEl, {
      orientation: 'white',
      coordinatesOnSquares: true,
      movable: { free: false },
      premovable: { enabled: false },
      predroppable: { enabled: false },
      highlight: { lastMove: true },
      selectable: { enabled: false },
      draggable: { enabled: false },
      drawable: { enabled: false },
    }),
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
      gameViewResources.board.move(handleInputResult.move[0], handleInputResult.move[1]);
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
