import type { Square } from 'chess.js';

import { parse, sanitizeInputString } from '../grammar/chess-grammar-parser';
import { chessGrammarControlActions } from '../grammar/chess-grammar-san-map-en';

export const GAME_INPUT_PARSE_STATUS_OK_SAN = 'ok_san';
export const GAME_INPUT_PARSE_STATUS_OK_COORDS = 'ok_coords';
export const GAME_INPUT_PARSE_STATUS_IGNORE = 'ignore';
export const GAME_INPUT_PARSE_STATUS_CONTROL_ACTION = 'control_action';

// --------------------------------------------------------------------------
export type GameInputParseStatus =
  | typeof GAME_INPUT_PARSE_STATUS_OK_SAN
  | typeof GAME_INPUT_PARSE_STATUS_OK_COORDS
  | typeof GAME_INPUT_PARSE_STATUS_IGNORE
  | typeof GAME_INPUT_PARSE_STATUS_CONTROL_ACTION;

// --------------------------------------------------------------------------
export type GameInputParserResultOkSan = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_OK_SAN;
  readonly input: string;
  readonly sanitized: string;
  readonly parsed: string | undefined;
  readonly san: string;
};
export type GameInputParserResultOkCoords = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_OK_COORDS;
  readonly input: string;
  readonly sanitized: string;
  readonly parsed: string | undefined;
  readonly coords: [Square, Square];
};
export type GameInputParserResultControlAction = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_CONTROL_ACTION;
  readonly input: string;
  readonly sanitized: string;
  readonly parsed: string | undefined;
  readonly action: string;
};
export type GameInputParserResultIgnore = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_IGNORE;
  readonly input: string;
  readonly parsed: string | undefined;
  readonly sanitized: string;
};

export type GameInputParserResultOk = GameInputParserResultOkSan | GameInputParserResultOkCoords;

export type GameInputParserResult =
  | GameInputParserResultOk
  | GameInputParserResultControlAction
  | GameInputParserResultIgnore;

// --------------------------------------------------------------------------
// Convert a text input into a parser result
export function gameModelRead(input: string): GameInputParserResult {
  const sanitized = sanitizeInputString(input);

  const parsed = parse(input);

  if (parsed === undefined) {
    return {
      status: GAME_INPUT_PARSE_STATUS_IGNORE,
      input,
      sanitized,
      parsed,
    };
  }

  if (Array.isArray(parsed)) {
    return {
      status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
      input,
      sanitized,
      parsed: JSON.stringify(parsed),
      coords: parsed,
    };
  }

  if (chessGrammarControlActions.includes(parsed as never)) {
    return {
      status: GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
      input,
      sanitized,
      parsed,
      action: parsed,
    };
  }

  return {
    status: GAME_INPUT_PARSE_STATUS_OK_SAN,
    input,
    sanitized,
    parsed,
    san: parsed,
  };
}
