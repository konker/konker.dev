import type { Square } from 'chess.js';

import type { GameModelResources } from './index';
import type { GameInputParserResultOk, GameInputParserResultOkSan } from './read';
import { GAME_INPUT_PARSE_STATUS_OK_SAN } from './read';

// --------------------------------------------------------------------------
export const GAME_MOVE_STATUS_OK = 'ok';
export const GAME_MOVE_STATUS_ILLEGAL = 'illegal';

export type GameMoveResult =
  | {
      readonly status: typeof GAME_MOVE_STATUS_OK;
      readonly input: string;
      readonly sanitized: string;
      readonly move: [Square, Square];
    }
  | {
      readonly status: typeof GAME_MOVE_STATUS_ILLEGAL;
      readonly input: string;
      readonly sanitized: string;
    };

// --------------------------------------------------------------------------
export function playMoveCandidates(
  gameModelResources: GameModelResources,
  parserResult: GameInputParserResultOkSan
): GameMoveResult {
  try {
    const moveCandidate =
      parserResult.san.candidates.find(gameModelResources.isLegalMove) ?? parserResult.san.candidates[0];
    const move = gameModelResources.chess.move(moveCandidate);
    return {
      status: GAME_MOVE_STATUS_OK,
      input: parserResult.input,
      sanitized: parserResult.sanitized,
      move: [move.from, move.to],
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_: unknown) {
    return {
      status: GAME_MOVE_STATUS_ILLEGAL,
      input: parserResult.input,
      sanitized: parserResult.sanitized,
    };
  }
}

// --------------------------------------------------------------------------
export function playMove(
  gameModelResources: GameModelResources,
  parserResult: GameInputParserResultOk
): GameMoveResult {
  try {
    if (parserResult.status === GAME_INPUT_PARSE_STATUS_OK_SAN && parserResult.san.candidates.length > 1) {
      return playMoveCandidates(gameModelResources, parserResult);
    }

    const move =
      parserResult.status === GAME_INPUT_PARSE_STATUS_OK_SAN
        ? gameModelResources.chess.move(parserResult.san.candidates[0])
        : gameModelResources.chess.move({ from: parserResult.coords[0], to: parserResult.coords[1], promotion: 'q' });

    return {
      status: GAME_MOVE_STATUS_OK,
      input: parserResult.input,
      sanitized: parserResult.sanitized,
      move: [move.from, move.to],
    };
  } catch {
    return {
      status: GAME_MOVE_STATUS_ILLEGAL,
      input: parserResult.input,
      sanitized: parserResult.sanitized,
    };
  }
}
