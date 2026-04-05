import type { Square } from 'chess.js';

import type { GameModelResources } from './index.js';
import { gameModelPushHistoryMove } from './index.js';
import type { GameInputParserResultOk, GameInputParserResultOkSan } from './read.js';
import { GAME_INPUT_PARSE_STATUS_OK_SAN } from './read.js';

// --------------------------------------------------------------------------
export const GAME_MOVE_STATUS_OK = 'ok';
export const GAME_MOVE_STATUS_ILLEGAL = 'illegal';
export const GAME_MOVE_ILLEGAL_REASON_AMBIGUOUS = 'ambiguous';
export const GAME_MOVE_ILLEGAL_REASON_INVALID = 'invalid';

export type GameMoveIllegalReason = typeof GAME_MOVE_ILLEGAL_REASON_AMBIGUOUS | typeof GAME_MOVE_ILLEGAL_REASON_INVALID;

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
  readonly reason: GameMoveIllegalReason;
};

export type GameMoveResult = GameMoveResultOk | GameMoveResultIllegal;

function normalizeSanForAmbiguityCheck(san: string): string {
  const trimmedSan = san.replace(/[+#]+$/, '');
  const pieceMoveMatch = /^([KQRBN])([a-h1-8]{1,2})(x?)([a-h][1-8](?:=[QRBN])?)$/.exec(trimmedSan);

  if (!pieceMoveMatch) {
    return trimmedSan;
  }

  return `${pieceMoveMatch[1]}${pieceMoveMatch[3]}${pieceMoveMatch[4]}`;
}

function isAmbiguousSanMove(gameModelResources: GameModelResources, san: string): boolean {
  const normalizedSan = normalizeSanForAmbiguityCheck(san);
  const matchingLegalMoves = gameModelResources.chess
    .moves()
    .filter((legalSan) => normalizeSanForAmbiguityCheck(legalSan) === normalizedSan);

  return matchingLegalMoves.length > 1;
}

// --------------------------------------------------------------------------
export function playMoveCandidates(
  gameModelResources: GameModelResources,
  parserResult: GameInputParserResultOkSan
): GameMoveResult {
  const legalCandidates = parserResult.san.candidates.filter(gameModelResources.isLegalMove);

  if (legalCandidates.length > 1) {
    return {
      status: GAME_MOVE_STATUS_ILLEGAL,
      input: parserResult.input,
      sanitized: parserResult.sanitized,
      message: 'Ambiguous move',
      reason: GAME_MOVE_ILLEGAL_REASON_AMBIGUOUS,
    };
  }

  const moveCandidate = legalCandidates[0] ?? parserResult.san.candidates[0];
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
        reason: GAME_MOVE_ILLEGAL_REASON_INVALID,
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
        reason:
          parserResult.status === GAME_INPUT_PARSE_STATUS_OK_SAN &&
          isAmbiguousSanMove(gameModelResources, parserResult.san.candidates[0])
            ? GAME_MOVE_ILLEGAL_REASON_AMBIGUOUS
            : GAME_MOVE_ILLEGAL_REASON_INVALID,
      };
}
