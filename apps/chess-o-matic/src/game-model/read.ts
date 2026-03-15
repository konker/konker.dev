import type { Square } from 'chess.js';

import { grammarSanMap, grammarStopWords } from '../grammar/chess-grammar-san-map-en';

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
  readonly sanitized: string;
  readonly san: string;
};
export type GameInputParserResultOkCoords = {
  readonly status: typeof GAME_INPUT_PARSE_STATUS_OK_COORDS;
  readonly sanitized: string;
  readonly coords: [Square, Square];
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
export function sanitizeInputString(input: string): string {
  // FIXME: strip out non-essential words before lookup, e.g. check, mate, etc.
  return grammarStopWords.reduce((acc, val) => acc.replace(val, ''), input).trim();
}

// --------------------------------------------------------------------------
export function parseCoordMove(sanitized: string): [Square, Square] | null {
  const [from, to] = sanitized.split(' to ');
  if (from in grammarSanMap && to in grammarSanMap) {
    return [grammarSanMap[from] as Square, grammarSanMap[to] as Square];
  }
  return null;
}

// --------------------------------------------------------------------------
// Convert a text input into a parser result
export function gameModelRead(input: string): GameInputParserResult {
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
