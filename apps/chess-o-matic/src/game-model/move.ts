import type { Square } from 'chess.js';

import type { GameModelResources } from './index.js';
import { gameModelPushHistoryMove } from './index.js';
import type { GameInputParserResultOk, GameInputParserResultOkSan } from './read.js';
import { GAME_INPUT_PARSE_STATUS_OK_SAN } from './read.js';

// --------------------------------------------------------------------------
export const GAME_MOVE_STATUS_OK = 'ok';
export const GAME_MOVE_STATUS_ILLEGAL = 'illegal';

export type GameMoveResultOk = {
  readonly status: typeof GAME_MOVE_STATUS_OK;
  readonly input: string;
  readonly sanitized: string;
  readonly move: [Square, Square];
};

export type GameMoveResultIllegal = {
  readonly status: typeof GAME_MOVE_STATUS_ILLEGAL;
  readonly input: string;
  readonly sanitized: string;
  readonly message: string;
};

export type GameMoveResult = GameMoveResultOk | GameMoveResultIllegal;

// --------------------------------------------------------------------------
export function playMoveCandidates(
  gameModelResources: GameModelResources,
  parserResult: GameInputParserResultOkSan
): GameMoveResult {
  const moveCandidate =
    parserResult.san.candidates.find(gameModelResources.isLegalMove) ?? parserResult.san.candidates[0];
  const moveResult = gameModelResources.chessMoveSafe(moveCandidate);

  if (moveResult.ok) {
    gameModelPushHistoryMove(gameModelResources, moveResult.move);
  }

  return moveResult.ok
    ? {
        status: GAME_MOVE_STATUS_OK,
        input: parserResult.input,
        sanitized: parserResult.sanitized,
        move: [moveResult.move.from, moveResult.move.to],
      }
    : {
        status: GAME_MOVE_STATUS_ILLEGAL,
        input: parserResult.input,
        sanitized: parserResult.sanitized,
        message: moveResult.message,
      };
}

// --------------------------------------------------------------------------
export function playMove(
  gameModelResources: GameModelResources,
  parserResult: GameInputParserResultOk
): GameMoveResult {
  if (parserResult.status === GAME_INPUT_PARSE_STATUS_OK_SAN && parserResult.san.candidates.length > 1) {
    return playMoveCandidates(gameModelResources, parserResult);
  }

  const moveResult =
    parserResult.status === GAME_INPUT_PARSE_STATUS_OK_SAN
      ? gameModelResources.chessMoveSafe(parserResult.san.candidates[0])
      : gameModelResources.chessMoveSafe({
          from: parserResult.coords[0],
          to: parserResult.coords[1],
          promotion: 'q',
        });

  if (moveResult.ok) {
    gameModelPushHistoryMove(gameModelResources, moveResult.move);
  }

  return moveResult.ok
    ? {
        status: GAME_MOVE_STATUS_OK,
        input: parserResult.input,
        sanitized: parserResult.sanitized,
        move: [moveResult.move.from, moveResult.move.to],
      }
    : {
        status: GAME_MOVE_STATUS_ILLEGAL,
        input: parserResult.input,
        sanitized: parserResult.sanitized,
        message: moveResult.message,
      };
}
