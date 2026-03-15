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
export const GAME_MODEL_EVALUATE_STATUS_OK = 'ok';
export const GAME_MODEL_EVALUATE_STATUS_ILLEGAL = 'illegal';
export const GAME_MODEL_EVALUATE_STATUS_CONTROL = 'control';
export const GAME_MODEL_EVALUATE_STATUS_IGNORE = 'ignore';

export type GameModelEvaluateStatus =
  | typeof GAME_MODEL_EVALUATE_STATUS_OK
  | typeof GAME_MODEL_EVALUATE_STATUS_ILLEGAL
  | typeof GAME_MODEL_EVALUATE_STATUS_CONTROL
  | typeof GAME_MODEL_EVALUATE_STATUS_IGNORE;

export type GameModelEvaluateResult =
  | {
      status: typeof GAME_MODEL_EVALUATE_STATUS_OK;
      sanitized: string;
      move: [Square, Square];
    }
  | {
      status: typeof GAME_MODEL_EVALUATE_STATUS_ILLEGAL;
      sanitized: string;
    }
  | {
      status: typeof GAME_MODEL_EVALUATE_STATUS_CONTROL;
      sanitized: string;
      action: string; // FIXME: make into union type
    }
  | {
      status: typeof GAME_MODEL_EVALUATE_STATUS_IGNORE;
      sanitized: string;
    };

// --------------------------------------------------------------------------
export function gameModelEvaluate(
  gameModelResources: GameModelResources,
  parserResult: GameInputParserResult
): GameModelEvaluateResult {
  switch (parserResult.status) {
    case GAME_INPUT_PARSE_STATUS_IGNORE: {
      return {
        status: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        sanitized: parserResult.sanitized,
      };
    }

    case GAME_INPUT_PARSE_STATUS_CONTROL_ACTION: {
      switch (parserResult.action) {
        case '_undo': {
          const move = gameModelResources.chess.undo();
          return move
            ? {
                status: GAME_MODEL_EVALUATE_STATUS_OK,
                sanitized: parserResult.sanitized,
                move: [move.to, move.from], // Move back
              }
            : { status: GAME_MODEL_EVALUATE_STATUS_IGNORE, sanitized: parserResult.sanitized };
        }
        case '_flip': {
          return {
            status: GAME_MODEL_EVALUATE_STATUS_CONTROL,
            sanitized: parserResult.sanitized,
            action: '_flip',
          };
        }
        case '_resign': {
          // FIXME: this doesn't work
          const san = gameModelResources.chess.turn() === 'w' ? '0-1' : '1-0';
          const moveResult = playMove(gameModelResources, {
            status: GAME_INPUT_PARSE_STATUS_OK_SAN,
            sanitized: san,
            san,
          });

          if (moveResult.status === GAME_MOVE_STATUS_ILLEGAL) {
            return {
              status: GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
              sanitized: parserResult.sanitized,
            };
          }

          return {
            status: GAME_MODEL_EVALUATE_STATUS_OK,
            sanitized: parserResult.sanitized,
            move: moveResult.move,
          };
        }
      }

      return {
        status: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        sanitized: parserResult.sanitized,
      };
    }

    case GAME_INPUT_PARSE_STATUS_OK_SAN:
    case GAME_INPUT_PARSE_STATUS_OK_COORDS:
    default: {
      const moveResult = playMove(gameModelResources, parserResult);
      if (moveResult.status === GAME_MOVE_STATUS_ILLEGAL) {
        return {
          status: GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
          sanitized: parserResult.sanitized,
        };
      }

      return {
        status: GAME_MODEL_EVALUATE_STATUS_OK,
        sanitized: parserResult.sanitized,
        move: moveResult.move,
      };
    }
  }
}
