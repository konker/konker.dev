import { Chess } from 'chess.js';

import { grammarSanMap } from '../grammar/chess-grammar-san-map-en';

// --------------------------------------------------------------------------
export type GameModelResources = {
  readonly chess: Chess;
};

// --------------------------------------------------------------------------
export const GAME_MOVE_PARSE_STATUS_OK = 'ok';
export const GAME_MOVE_PARSE_STATUS_IGNORE = 'ignore';
export const GAME_MOVE_PARSE_STATUS_CONTROL_ACTION = 'control_action';

export type GameMoveParseStatus =
  | typeof GAME_MOVE_PARSE_STATUS_OK
  | typeof GAME_MOVE_PARSE_STATUS_IGNORE
  | typeof GAME_MOVE_PARSE_STATUS_CONTROL_ACTION;

// --------------------------------------------------------------------------
export type GameMoveParserResultOk = {
  readonly status: typeof GAME_MOVE_PARSE_STATUS_OK;
  readonly san: string;
};
export type GameMoveParserResultControlAction = {
  readonly status: typeof GAME_MOVE_PARSE_STATUS_CONTROL_ACTION;
  action: string;
};
export type GameMoveParserResultIgnore = { readonly status: typeof GAME_MOVE_PARSE_STATUS_IGNORE };

export type GameMoveParserResult =
  | GameMoveParserResultOk
  | GameMoveParserResultControlAction
  | GameMoveParserResultIgnore;

// --------------------------------------------------------------------------
export const GAME_MOVE_STATUS_OK = 'ok';
export const GAME_MOVE_STATUS_ILLEGAL = 'illegal';

export type GameMoveStatus = typeof GAME_MOVE_STATUS_OK | typeof GAME_MOVE_STATUS_ILLEGAL;

export type GameMoveResult =
  | {
      readonly status: typeof GAME_MOVE_STATUS_OK;
      readonly san: string;
    }
  | {
      readonly status: typeof GAME_MOVE_STATUS_ILLEGAL;
      readonly san: string;
    };

// --------------------------------------------------------------------------
export function playMove(gameModelResources: GameModelResources, parserResult: GameMoveParserResultOk): GameMoveResult {
  try {
    const move = gameModelResources.chess.move(parserResult.san);
    return {
      status: GAME_MOVE_STATUS_OK,
      san: parserResult.san,
    };
  } catch (_e: unknown) {
    return {
      status: GAME_MOVE_STATUS_ILLEGAL,
      san: parserResult.san,
    };
  }
}

// --------------------------------------------------------------------------
export function gameModelParseInput(gameModelResources: GameModelResources, input: string): GameMoveParserResult {
  // FIXME: remove non-essential words before lookup, e.g. check, mate, etc.

  const san = grammarSanMap[input] ?? null;
  if (san === null) {
    return {
      status: GAME_MOVE_PARSE_STATUS_IGNORE,
    };
  }

  if (san === '_undo') {
    return {
      status: GAME_MOVE_PARSE_STATUS_CONTROL_ACTION,
      action: '_undo',
    };
  }

  if (san === '_resign') {
    return {
      status: GAME_MOVE_PARSE_STATUS_CONTROL_ACTION,
      action: '_resign',
    };
  }

  return {
    status: GAME_MOVE_PARSE_STATUS_OK,
    san,
  };
}

// --------------------------------------------------------------------------
export const GAME_MODEL_HANDLE_INPUT_STATUS_OK = 'ok';
export const GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL = 'illegal';
export const GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE = 'ignore';

export type GameModelHandleInputStatus =
  | typeof GAME_MODEL_HANDLE_INPUT_STATUS_OK
  | typeof GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL
  | typeof GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE;

export type GameModelHandleInputResult =
  | {
      status: typeof GAME_MODEL_HANDLE_INPUT_STATUS_OK;
      san: string;
    }
  | {
      status: typeof GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL;
      san: string;
    }
  | {
      status: typeof GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE;
    };

// --------------------------------------------------------------------------
export function handleInput(gameModelResources: GameModelResources, input: string): GameModelHandleInputResult {
  const parserResult = gameModelParseInput(gameModelResources, input);
  switch (parserResult.status) {
    case GAME_MOVE_PARSE_STATUS_IGNORE: {
      return {
        status: GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE,
      };
    }

    case GAME_MOVE_PARSE_STATUS_CONTROL_ACTION: {
      if (parserResult.action === '_undo') {
        gameModelResources.chess.undo();
        return {
          status: GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE,
        };
      }
      if (parserResult.action === '_resign') {
        // FIXME: this doesn't work
        const san = gameModelResources.chess.turn() === 'w' ? '0-1' : '1-0';
        const move = playMove(gameModelResources, {
          status: GAME_MOVE_PARSE_STATUS_OK,
          san,
        });
        if (move.status === GAME_MOVE_STATUS_ILLEGAL) {
          return {
            status: GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL,
            san,
          };
        }

        return {
          status: GAME_MODEL_HANDLE_INPUT_STATUS_OK,
          san,
        };
      }
      return {
        status: GAME_MODEL_HANDLE_INPUT_STATUS_IGNORE,
      };
    }

    case GAME_MOVE_PARSE_STATUS_OK:
    default: {
      const move = playMove(gameModelResources, parserResult);
      if (move.status === GAME_MOVE_STATUS_ILLEGAL) {
        return {
          status: GAME_MODEL_HANDLE_INPUT_STATUS_ILLEGAL,
          san: parserResult.san,
        };
      }

      return {
        status: GAME_MODEL_HANDLE_INPUT_STATUS_OK,
        san: parserResult.san,
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
