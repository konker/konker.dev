import type { Square } from 'chess.js';
import { Chess } from 'chess.js';

import { grammarSanMap, grammarStopWords } from '../grammar/chess-grammar-san-map-en';

// --------------------------------------------------------------------------
export type GameModelResources = {
  readonly chess: Chess;
};

// --------------------------------------------------------------------------
export const GAME_INPUT_PARSE_STATUS_OK_SAN = 'ok_san';
export const GAME_INPUT_PARSE_STATUS_OK_COORDS = 'ok_coords';
export const GAME_INPUT_PARSE_STATUS_IGNORE = 'ignore';
export const GAME_INPUT_PARSE_STATUS_CONTROL_ACTION = 'control_action';

export type GameInputParseStatus =
  | typeof GAME_INPUT_PARSE_STATUS_OK_SAN
  | typeof GAME_INPUT_PARSE_STATUS_OK_COORDS
  | typeof GAME_INPUT_PARSE_STATUS_IGNORE
  | typeof GAME_INPUT_PARSE_STATUS_CONTROL_ACTION;

// --------------------------------------------------------------------------
export type GameInputParserResultOkSan = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_OK_SAN;
  readonly sanitized: string;
  readonly san: string;
};
export type GameInputParserResultOkCoords = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_OK_COORDS;
  readonly sanitized: string;
  readonly coords: [string, string];
};
export type GameInputParserResultControlAction = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_CONTROL_ACTION;
  readonly sanitized: string;
  readonly action: string;
};
export type GameInputParserResultIgnore = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_IGNORE;
  readonly sanitized: string;
};

export type GameInputParserResultOk = GameInputParserResultOkSan | GameInputParserResultOkCoords;

export type GameInputParserResult =
  | GameInputParserResultOk
  | GameInputParserResultControlAction
  | GameInputParserResultIgnore;

// --------------------------------------------------------------------------
export const GAME_MOVE_STATUS_OK = 'ok';
export const GAME_MOVE_STATUS_ILLEGAL = 'illegal';

export type GameMoveStatus = typeof GAME_MOVE_STATUS_OK | typeof GAME_MOVE_STATUS_ILLEGAL;

export type GameMoveResult =
  | {
      readonly status: typeof GAME_MOVE_STATUS_OK;
      readonly sanitized: string;
      readonly move: [Square, Square];
    }
  | {
      readonly status: typeof GAME_MOVE_STATUS_ILLEGAL;
      readonly sanitized: string;
    };

// --------------------------------------------------------------------------
export function playMove(
  gameModelResources: GameModelResources,
  parserResult: GameInputParserResultOk
): GameMoveResult {
  try {
    const move =
      parserResult.status === GAME_INPUT_PARSE_STATUS_OK_SAN
        ? gameModelResources.chess.move(parserResult.san)
        : gameModelResources.chess.move(parserResult.coords.join('-'));
    return {
      status: GAME_MOVE_STATUS_OK,
      sanitized: parserResult.sanitized,
      move: [move.from, move.to],
    };
  } catch (_e: unknown) {
    return {
      status: GAME_MOVE_STATUS_ILLEGAL,
      sanitized: parserResult.sanitized,
    };
  }
}

// --------------------------------------------------------------------------
export function sanitizeInputString(input: string): string {
  // FIXME: strip out non-essential words before lookup, e.g. check, mate, etc.
  return grammarStopWords.reduce((acc, val) => acc.replace(val, ''), input).trim();
}

// --------------------------------------------------------------------------
export function parseCoordMove(sanitized: string): [string, string] | null {
  const [from, to] = sanitized.split(' to ');
  if (from in grammarSanMap && to in grammarSanMap) {
    return [grammarSanMap[from]!, grammarSanMap[to]!];
  }
  return null;
}

// --------------------------------------------------------------------------
export function gameModelParseInput(_gameModelResources: GameModelResources, input: string): GameInputParserResult {
  const sanitized = sanitizeInputString(input);

  const move =
    sanitized in grammarSanMap
      ? grammarSanMap[sanitized]
      : Object.values(grammarSanMap).includes(sanitized)
        ? sanitized
        : sanitized.includes(' to ')
          ? parseCoordMove(sanitized)
          : null;

  if (move === null) {
    return {
      status: GAME_INPUT_PARSE_STATUS_IGNORE,
      sanitized,
    };
  }

  if (Array.isArray(move)) {
    return {
      status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
      sanitized,
      coords: move,
    };
  }

  if (['_undo', '_flip', '_resign'].includes(move)) {
    return {
      status: GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
      sanitized,
      action: move,
    };
  }

  return {
    status: GAME_INPUT_PARSE_STATUS_OK_SAN,
    sanitized,
    san: move,
  };
}

// --------------------------------------------------------------------------
export const GAME_MODEL_HANDLE_INPUT_STATUS_OK = 'ok';
export const GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL = 'illegal';
export const GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL = 'control';
export const GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE = 'ignore';

export type GameModelHandleInputStatus =
  | typeof GAME_MODEL_HANDLE_INPUT_STATUS_OK
  | typeof GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL
  | typeof GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL
  | typeof GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE;

export type GameModelHandleInputResult =
  | {
      status: typeof GAME_MODEL_HANDLE_INPUT_STATUS_OK;
      sanitized: string;
      move: [Square, Square];
    }
  | {
      status: typeof GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL;
      sanitized: string;
    }
  | {
      status: typeof GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL;
      sanitized: string;
      action: string; // FIXME: make into union type
    }
  | {
      status: typeof GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE;
      sanitized: string;
    };

// --------------------------------------------------------------------------
export function handleInput(gameModelResources: GameModelResources, input: string): GameModelHandleInputResult {
  const parserResult = gameModelParseInput(gameModelResources, input);
  switch (parserResult.status) {
    case GAME_INPUT_PARSE_STATUS_IGNORE: {
      return {
        status: GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE,
        sanitized: parserResult.sanitized,
      };
    }

    case GAME_INPUT_PARSE_STATUS_CONTROL_ACTION: {
      switch (parserResult.action) {
        case '_undo': {
          const move = gameModelResources.chess.undo();
          return move
            ? {
                status: GAME_MODEL_HANDLE_INPUT_STATUS_OK,
                sanitized: parserResult.sanitized,
                move: [move.to, move.from],
              }
            : { status: GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE, sanitized: parserResult.sanitized };
        }
        case '_flip': {
          return {
            status: GAME_MODEL_HANDLE_INPUT_STATUS_CONTROL,
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
              status: GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL,
              sanitized: parserResult.sanitized,
            };
          }

          return {
            status: GAME_MODEL_HANDLE_INPUT_STATUS_OK,
            sanitized: parserResult.sanitized,
            move: moveResult.move,
          };
        }
      }

      return {
        status: GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE,
        sanitized: parserResult.sanitized,
      };
    }

    case GAME_INPUT_PARSE_STATUS_OK_SAN:
    case GAME_INPUT_PARSE_STATUS_OK_COORDS:
    default: {
      const moveResult = playMove(gameModelResources, parserResult);
      if (moveResult.status === GAME_MOVE_STATUS_ILLEGAL) {
        return {
          status: GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL,
          sanitized: parserResult.sanitized,
        };
      }

      return {
        status: GAME_MODEL_HANDLE_INPUT_STATUS_OK,
        sanitized: parserResult.sanitized,
        move: moveResult.move,
      };
    }
  }
}

// --------------------------------------------------------------------------
export function initGameModel(): GameModelResources {
  return {
    chess: new Chess(),
  };
}

// --------------------------------------------------------------------------
export function exitGameModel(_gameModelResources: GameModelResources): void {
  return;
}
