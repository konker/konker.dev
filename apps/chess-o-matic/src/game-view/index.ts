import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';

import { Chessground } from '@lichess-org/chessground';

import type { GameModelHandleInputResult } from '../game-model';
import { GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL, GAME_MODEL_HANDLE_INPUT_STATUS_OK } from '../game-model';

export type GameViewResources<T = ReturnType<typeof Chessground>> = {
  readonly board: T;
};

export function initGameView(boardEl: HTMLElement): GameViewResources {
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
  };
}

export function handleGameViewUpdate(
  gameViewResources: GameViewResources,
  handleInputResult: GameModelHandleInputResult
): GameViewResources {
  switch (handleInputResult.status) {
    case GAME_MODEL_HANDLE_INPUT_STATUS_OK: {
      gameViewResources.board.move(handleInputResult.move[0], handleInputResult.move[1]);
      return gameViewResources;
    }
    case GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL: {
      switch (handleInputResult.action) {
        case '_flip':
          gameViewResources.board.toggleOrientation();
          return gameViewResources;
      }
    }
  }
  return gameViewResources;
}

export function exitGameView(_gameViewResource: GameViewResources): void {
  return;
}
