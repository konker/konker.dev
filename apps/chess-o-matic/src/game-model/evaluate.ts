import type { Square } from 'chess.js';

import type { GameModelResources } from './index';
import { GAME_MOVE_STATUS_ILLEGAL, playMove } from './move';
import type { GameInputParserResult } from './read';
import {
  GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
  GAME_INPUT_PARSE_STATUS_OK_COORDS,
  GAME_INPUT_PARSE_STATUS_OK_SAN,
} from './read';
import { GAME_INPUT_PARSE_STATUS_IGNORE } from './read';

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

export type GameModelEvaluateResultOk = {
  status: typeof GAME_MODEL_EVALUATE_STATUS_OK;
  input: string;
  sanitized: string;
  parsed: string | undefined;
  move: [Square, Square];
};

export type GameModelEvaluateResultIllegal = {
  status: typeof GAME_MODEL_EVALUATE_STATUS_ILLEGAL;
  input: string;
  sanitized: string;
  parsed: string | undefined;
};

export type GameModelEvaluateResultControl = {
  status: typeof GAME_MODEL_EVALUATE_STATUS_CONTROL;
  input: string;
  sanitized: string;
  action: GameModelControlAction;
  parsed: string | undefined;
};

export type GameModelEvaluateResultIgnore = {
  status: typeof GAME_MODEL_EVALUATE_STATUS_IGNORE;
  input: string;
  sanitized: string;
  parsed: string | undefined;
};

export type GameModelEvaluateResult =
  | GameModelEvaluateResultOk
  | GameModelEvaluateResultIllegal
  | GameModelEvaluateResultControl
  | GameModelEvaluateResultIgnore;

// --------------------------------------------------------------------------
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
          const move = gameModelResources.chess.undo();
          return move
            ? {
                status: GAME_MODEL_EVALUATE_STATUS_OK,
                input: parserResult.input,
                sanitized: parserResult.sanitized,
                parsed: parserResult.parsed,
                move: [move.to, move.from], // Move back
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
            san,
          });

          if (moveResult.status === GAME_MOVE_STATUS_ILLEGAL) {
            return {
              status: GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
              input: parserResult.input,
              sanitized: parserResult.sanitized,
              parsed: parserResult.parsed,
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
