import type { Square } from 'chess.js';

import type { GameViewResources } from '../game-view';
import { BOARD_COLOR_DARK, BOARD_COLOR_LIGHT } from '../game-view/types';
import type { GameModelResources } from './index.js';
import type { GAME_MOVE_STATUS_OK, GameMoveResult, GameMoveResultOk } from './move.js';
import { GAME_MOVE_STATUS_ILLEGAL, playMove } from './move.js';
import type { GameInputParserResult } from './read.js';
import {
  GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
  GAME_INPUT_PARSE_STATUS_OK_COORDS,
  GAME_INPUT_PARSE_STATUS_OK_SAN,
} from './read.js';
import { GAME_INPUT_PARSE_STATUS_IGNORE } from './read.js';

// --------------------------------------------------------------------------
export const GAME_MODEL_CONTROL_ACTION_FLIP = '_flip';
export type GameModelControlAction = typeof GAME_MODEL_CONTROL_ACTION_FLIP;

// --------------------------------------------------------------------------
export const GAME_MODEL_EVALUATE_STATUS_OK = 'ok';
export const GAME_MODEL_EVALUATE_STATUS_ILLEGAL = 'illegal';
export const GAME_MODEL_EVALUATE_STATUS_CONTROL = 'control';
export const GAME_MODEL_EVALUATE_STATUS_IGNORE = 'ignore';

export type GameModelEvaluateStatus =
  | typeof GAME_MODEL_EVALUATE_STATUS_OK
  | typeof GAME_MODEL_EVALUATE_STATUS_ILLEGAL
  | typeof GAME_MODEL_EVALUATE_STATUS_CONTROL
  | typeof GAME_MODEL_EVALUATE_STATUS_IGNORE;

// --------------------------------------------------------------------------
export type GameMoveFlags = {
  readonly isCapture: boolean;
  readonly isCheck: boolean;
  readonly isCastle: boolean;
  readonly isPromotion: boolean;
  readonly isBottomMove: boolean;
  readonly isCheckmate: boolean;
  readonly isDraw: boolean;
  readonly isEnd: boolean;
};

export const DEFAULT_GAME_MODEL_FLAGS: GameMoveFlags = {
  isCapture: false,
  isCheck: false,
  isCastle: false,
  isPromotion: false,
  isBottomMove: true,
  isCheckmate: false,
  isDraw: false,
  isEnd: false,
} as const;

// --------------------------------------------------------------------------
export type GameModelEvaluateResultOk = {
  readonly status: typeof GAME_MODEL_EVALUATE_STATUS_OK;
  readonly input: string;
  readonly sanitized: string;
  readonly parsed: string | undefined;
  readonly move: [Square, Square];
  readonly flags: GameMoveFlags;
};

export type GameModelEvaluateResultIllegal = {
  readonly status: typeof GAME_MODEL_EVALUATE_STATUS_ILLEGAL;
  readonly input: string;
  readonly sanitized: string;
  readonly parsed: string | undefined;
  readonly message: string;
};

export type GameModelEvaluateResultControl = {
  readonly status: typeof GAME_MODEL_EVALUATE_STATUS_CONTROL;
  readonly input: string;
  readonly sanitized: string;
  readonly action: GameModelControlAction;
  readonly parsed: string | undefined;
};

export type GameModelEvaluateResultIgnore = {
  readonly status: typeof GAME_MODEL_EVALUATE_STATUS_IGNORE;
  readonly input: string;
  readonly sanitized: string;
  readonly parsed: string | undefined;
};

export type GameModelEvaluateResult =
  | GameModelEvaluateResultOk
  | GameModelEvaluateResultIllegal
  | GameModelEvaluateResultControl
  | GameModelEvaluateResultIgnore;

// --------------------------------------------------------------------------
export function gameModelResolveMoveFlags(
  gameModelResources: GameModelResources,
  gameViewResources: GameViewResources,
  _moveResult: GameMoveResultOk
): GameMoveFlags {
  const lastMoveSan = gameModelResources.chess.history().at(-1);
  const boardOrientation = gameViewResources.board.orientation();
  const lastMoveColor = gameModelResources.chess.turn();

  const isCheckmate = gameModelResources.chess.isCheckmate();
  const isCheck = gameModelResources.chess.isCheck();
  const isCapture = lastMoveSan?.includes('x') ?? false;
  const isCastle = lastMoveSan?.includes('O-O') ?? false;
  const isPromotion = lastMoveSan?.includes('=') ?? false;
  const isBottomMove =
    (boardOrientation === BOARD_COLOR_LIGHT && lastMoveColor === 'b') ||
    (boardOrientation === BOARD_COLOR_DARK && lastMoveColor === 'w');
  const isDraw = gameModelResources.chess.isDraw();
  const isEnd = gameModelResources.chess.isGameOver();

  return {
    isCheckmate,
    isCheck,
    isCapture,
    isCastle,
    isPromotion,
    isBottomMove,
    isDraw,
    isEnd,
  };
}

// --------------------------------------------------------------------------
export function gameModelEvaluate(
  gameModelResources: GameModelResources,
  gameViewResources: GameViewResources,
  parserResult: GameInputParserResult
): GameModelEvaluateResult {
  switch (parserResult.status) {
    case GAME_INPUT_PARSE_STATUS_IGNORE: {
      return {
        status: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        input: parserResult.input,
        sanitized: parserResult.sanitized,
        parsed: parserResult.parsed,
      };
    }

    case GAME_INPUT_PARSE_STATUS_CONTROL_ACTION: {
      switch (parserResult.action) {
        case 'undo': {
          const move = gameModelResources.chess.undo();
          return move
            ? {
                status: GAME_MODEL_EVALUATE_STATUS_OK,
                input: parserResult.input,
                sanitized: parserResult.sanitized,
                parsed: parserResult.parsed,
                move: [move.to, move.from], // Move back
                flags: DEFAULT_GAME_MODEL_FLAGS,
              }
            : {
                status: GAME_MODEL_EVALUATE_STATUS_IGNORE,
                input: parserResult.input,
                sanitized: parserResult.sanitized,
                parsed: parserResult.parsed,
              };
        }
        case 'flip': {
          return {
            status: GAME_MODEL_EVALUATE_STATUS_CONTROL,
            input: parserResult.input,
            sanitized: parserResult.sanitized,
            parsed: parserResult.parsed,
            action: GAME_MODEL_CONTROL_ACTION_FLIP,
          };
        }
        case 'resign': {
          // FIXME: this doesn't work
          const san = gameModelResources.chess.turn() === 'w' ? '0-1' : '1-0';
          const moveResult = playMove(gameModelResources, {
            status: GAME_INPUT_PARSE_STATUS_OK_SAN,
            input: san,
            sanitized: san,
            parsed: san,
            san: { candidates: [san] },
          });

          if (moveResult.status === GAME_MOVE_STATUS_ILLEGAL) {
            return {
              status: GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
              input: parserResult.input,
              sanitized: parserResult.sanitized,
              parsed: parserResult.parsed,
              message: moveResult.message,
            };
          }

          return {
            status: GAME_MODEL_EVALUATE_STATUS_OK,
            input: parserResult.input,
            sanitized: parserResult.sanitized,
            parsed: parserResult.parsed,
            move: moveResult.move,
            flags: DEFAULT_GAME_MODEL_FLAGS,
          };
        }
      }

      return {
        status: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        input: parserResult.input,
        sanitized: parserResult.sanitized,
        parsed: parserResult.parsed,
      };
    }

    case GAME_INPUT_PARSE_STATUS_OK_SAN:
    case GAME_INPUT_PARSE_STATUS_OK_COORDS:
    default: {
      const moveResult = playMove(gameModelResources, parserResult);
      if (moveResult.status === GAME_MOVE_STATUS_ILLEGAL) {
        return {
          status: GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
          input: parserResult.input,
          sanitized: parserResult.sanitized,
          parsed: parserResult.parsed,
          message: moveResult.message,
        };
      }

      return {
        status: GAME_MODEL_EVALUATE_STATUS_OK,
        input: parserResult.input,
        sanitized: parserResult.sanitized,
        parsed: parserResult.parsed,
        move: moveResult.move,
        flags: gameModelResolveMoveFlags(gameModelResources, gameViewResources, moveResult),
      };
    }
  }
}
