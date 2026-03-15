import type { Square } from 'chess.js';

import type { GameModelResources } from './index';
import type { GameInputParserResultOk } from './read';
import { GAME_INPUT_PARSE_STATUS_OK_SAN } from './read';

// --------------------------------------------------------------------------
export const GAME_MOVE_STATUS_OK = 'ok';
export const GAME_MOVE_STATUS_ILLEGAL = 'illegal';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_: unknown) {
    return {
      status: GAME_MOVE_STATUS_ILLEGAL,
      sanitized: parserResult.sanitized,
    };
  }
}
