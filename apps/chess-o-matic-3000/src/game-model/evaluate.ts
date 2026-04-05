import type { Square } from 'chess.js';

import type { GameModelResources } from './index.js';
import { GAME_MOVE_STATUS_ILLEGAL, playMove } from './move.js';
import type { GameInputParserResult } from './read.js';
import {
  GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
  GAME_INPUT_PARSE_STATUS_IGNORE,
  GAME_INPUT_PARSE_STATUS_OK_COORDS,
  GAME_INPUT_PARSE_STATUS_OK_SAN,
} from './read.js';

// --------------------------------------------------------------------------
export const GAME_MODEL_CONTROL_ACTION_FLIP = '_flip';
export const GAME_MODEL_CONTROL_ACTION_UNDO = '_undo';
export const GAME_MODEL_CONTROL_ACTION_RESIGN = '_resign';
export type GameModelControlAction =
  | typeof GAME_MODEL_CONTROL_ACTION_FLIP
  | typeof GAME_MODEL_CONTROL_ACTION_UNDO
  | typeof GAME_MODEL_CONTROL_ACTION_RESIGN;

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

export type GameModelEvaluateResultOk = {
  readonly status: typeof GAME_MODEL_EVALUATE_STATUS_OK;
  readonly input: string;
  readonly sanitized: string;
  readonly parsed: string | undefined;
  readonly move: [Square, Square];
};

export type GameModelEvaluateResultIllegal = {
  readonly status: typeof GAME_MODEL_EVALUATE_STATUS_ILLEGAL;
  readonly input: string;
  readonly sanitized: string;
  readonly parsed: string | undefined;
  readonly message: string;
  readonly reason: 'ambiguous' | 'invalid';
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

export function gameModelEvaluate(
  gameModelResources: GameModelResources,
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
          return {
            status: GAME_MODEL_EVALUATE_STATUS_CONTROL,
            input: parserResult.input,
            sanitized: parserResult.sanitized,
            parsed: parserResult.parsed,
            action: GAME_MODEL_CONTROL_ACTION_UNDO,
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
          return {
            status: GAME_MODEL_EVALUATE_STATUS_CONTROL,
            input: parserResult.input,
            sanitized: parserResult.sanitized,
            parsed: parserResult.parsed,
            action: GAME_MODEL_CONTROL_ACTION_RESIGN,
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
          reason: moveResult.reason,
        };
      }

      return {
        status: GAME_MODEL_EVALUATE_STATUS_OK,
        input: parserResult.input,
        sanitized: parserResult.sanitized,
        parsed: parserResult.parsed,
        move: moveResult.move,
      };
    }
  }
}
