import type { Square } from 'chess.js';

import type { NonEmptyReadonlyArray } from '../../lib';
import type { ChessGrammarFile } from './chess-grammar-en';
import { chessGrammarControlActions, chessGrammarFiles, chessGrammarPieceSymbols } from './chess-grammar-en';

// --------------------------------------------------------------------------
export function defaultPromotion(san: SAN, rank: string): SAN {
  return CHESS_PROMOTION_RANKS.includes(rank as (typeof CHESS_PROMOTION_RANKS)[number]) ? `${san}=Q` : san;
}

export function adjacentFiles(file: string): ReadonlyArray<ChessGrammarFile> {
  const idx = chessGrammarFiles.indexOf(file as ChessGrammarFile);
  if (idx === -1) {
    return [];
  }
  return [chessGrammarFiles[idx - 1], chessGrammarFiles[idx + 1]].filter((f): f is ChessGrammarFile => f !== undefined);
}

// --------------------------------------------------------------------------
export type SAN = string;
export type ControlAction = string;
export type SanCandidates = { readonly candidates: NonEmptyReadonlyArray<SAN> };

// --------------------------------------------------------------------------
export const NUMBER_WORD_MAP = [
  [/one/gi, '1'],
  [/two/gi, '2'],
  [/three/gi, '3'],
  [/four/gi, '4'],
  [/five/gi, '5'],
  [/six/gi, '6'],
  [/seven/gi, '7'],
  [/eight/gi, '8'],
] as const;

export const PIECE_WORD_MAP = [
  [/pawn/, 'P'],
  [/knight/, 'N'],
  [/bishop/, 'B'],
  [/rook/, 'R'],
  [/queen/, 'Q'],
  [/king/, 'K'],
] as const;

export const DISAMBIGUATOR_MAP = [
  [/alpha/, 'a'],
  [/beta/, 'b'],
  [/charlie/, 'c'],
  [/delta/, 'd'],
  [/echo/, 'e'],
  [/foxtrot/, 'f'],
  [/golf/, 'g'],
  [/hotel/, 'h'],
] as const;

export const CHESS_RANK_NUMS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
export const CHESS_PROMOTION_RANKS = ['1', '8'] as const;
export const CHESS_PROMOTION_PIECES = ['N', 'B', 'R', 'Q'] as const;

export const W_TO = '(?:to|2)' as const;
export const W_TAKES = 'takes' as const;
export const W_CAPTURES = 'captures' as const;
export const W_EN_PASSANT = 'en passant' as const;
export const W_CASTLE = 'castle' as const;
export const W_KING_SIDE = 'K side' as const;
export const W_QUEEN_SIDE = 'Q side' as const;
export const W_SHORT = 'short' as const;
export const W_LONG = 'long' as const;
export const W_PROMOTION = 'promotion' as const;
export const W_PROMOTE = 'promote' as const;

export const STOP_WORDS = ['check', 'mate', 'checkmate'] as const;

export const CONTROL_ACTION_RE_S = `(${chessGrammarControlActions.join('|')})` as const;

export const FILE_RE_S = `([${chessGrammarFiles.join('')}])` as const;
export const RANK_RE_S = `([${CHESS_RANK_NUMS.join('')}])` as const;
export const PROMOTION_RANK_RE_S = `([${CHESS_PROMOTION_RANKS.join('')}])` as const;
export const SQUARE_RE_S = `${FILE_RE_S} ${RANK_RE_S}` as const;
export const PROMOTION_SQUARE_RE_S = `${FILE_RE_S} ${PROMOTION_RANK_RE_S}` as const;
export const PIECE_RE_S = `([${chessGrammarPieceSymbols.join('').toUpperCase()}])` as const;
export const PROMOTION_PIECE_RE_S = `([${CHESS_PROMOTION_PIECES.join('')}])` as const;

// --------------------------------------------------------------------------
export function parseRanks(s: string): string {
  return NUMBER_WORD_MAP.reduce((acc, [regex, replacement]) => acc.replace(regex, replacement), s);
}

// --------------------------------------------------------------------------
export function parsePieces(s: string): string {
  return PIECE_WORD_MAP.reduce((acc, [regex, replacement]) => acc.replace(regex, replacement), s);
}

// --------------------------------------------------------------------------
export function parseDisambiguators(s: string): string {
  return DISAMBIGUATOR_MAP.reduce((acc, [regex, replacement]) => acc.replace(regex, replacement), s);
}

// --------------------------------------------------------------------------
export function sanitizeInputString(input: string): string {
  const cleanInput = STOP_WORDS.reduce((acc, val) => acc.replace(val, ''), input.trim().toLowerCase())
    .trim()
    .replace(/\s+/g, ' ');
  return parseRanks(parsePieces(parseDisambiguators(cleanInput)));
}

// --------------------------------------------------------------------------
export function matchControlInstruction(s: string): ControlAction | undefined {
  const res1 = [new RegExp(`^${CONTROL_ACTION_RE_S}$`)];
  const matches1 = res1.map((re) => re.exec(s));
  const match1 = matches1.find((x) => x !== null);
  if (match1) {
    return match1[1];
  }

  return undefined;
}

// --------------------------------------------------------------------------
export function matchPawnMove(s: string): SanCandidates | undefined {
  const res1 = [new RegExp(`^${SQUARE_RE_S}$`)];
  const matches1 = res1.map((re) => re.exec(s));
  const match1 = matches1.find((x) => x !== null);
  if (match1) {
    return { candidates: [defaultPromotion(`${match1[1]}${match1[2]}`, match1[2])] };
  }

  const res2 = [
    new RegExp(`^${FILE_RE_S} ${W_TAKES} ${SQUARE_RE_S}$`),
    new RegExp(`^${FILE_RE_S} ${W_TAKES} ${SQUARE_RE_S} ${W_EN_PASSANT}$`),
    new RegExp(`^${FILE_RE_S} ${W_CAPTURES} ${SQUARE_RE_S}$`),
    new RegExp(`^${FILE_RE_S} ${W_CAPTURES} ${SQUARE_RE_S} ${W_EN_PASSANT}$`),
  ];
  const matches2 = res2.map((re) => re.exec(s));
  const match2 = matches2.find((x) => x !== null);
  if (match2) {
    return { candidates: [defaultPromotion(`${match2[1]}x${match2[2]}${match2[3]}`, match2[3])] };
  }

  return undefined;
}

// --------------------------------------------------------------------------
export function matchPawnPromotionMove(s: string): SanCandidates | undefined {
  const res1 = [new RegExp(`^${PROMOTION_SQUARE_RE_S} ${W_PROMOTE}$`)];
  const matches1 = res1.map((re) => re.exec(s));
  const match1 = matches1.find((x) => x !== null);
  if (match1) {
    return { candidates: [`${match1[1]}${match1[2]}=Q`] };
  }

  const res2 = [
    new RegExp(`^${PROMOTION_SQUARE_RE_S} ${PROMOTION_PIECE_RE_S} ${W_PROMOTION}$`),
    new RegExp(`^${PROMOTION_SQUARE_RE_S} ${W_PROMOTE} ${W_TO} ${PROMOTION_PIECE_RE_S}$`),
  ];
  const matches2 = res2.map((re) => re.exec(s));
  const match2 = matches2.find((x) => x !== null);
  if (match2) {
    return { candidates: [`${match2[1]}${match2[2]}=${match2[3].toUpperCase()}`] };
  }

  const res3 = [
    new RegExp(`^${FILE_RE_S} ${W_TAKES} ${PROMOTION_SQUARE_RE_S} ${W_PROMOTE}$`),
    new RegExp(`^${FILE_RE_S} ${W_CAPTURES} ${PROMOTION_SQUARE_RE_S} ${W_PROMOTE}$`),
  ];
  const matches3 = res3.map((re) => re.exec(s));
  const match3 = matches3.find((x) => x !== null);
  if (match3) {
    return { candidates: [`${match3[1]}x${match3[2]}${match3[3]}=Q`] };
  }

  const res4 = [
    new RegExp(`^${FILE_RE_S} ${W_TAKES} ${PROMOTION_SQUARE_RE_S} ${PROMOTION_PIECE_RE_S} ${W_PROMOTION}$`),
    new RegExp(`^${FILE_RE_S} ${W_CAPTURES} ${PROMOTION_SQUARE_RE_S} ${W_PROMOTE} ${W_TO} ${PROMOTION_PIECE_RE_S}$`),
  ];
  const matches4 = res4.map((re) => re.exec(s));
  const match4 = matches4.find((x) => x !== null);
  if (match4) {
    return { candidates: [`${match4[1]}x${match4[2]}${match4[3]}=${match4[4].toUpperCase()}`] };
  }

  return undefined;
}

// --------------------------------------------------------------------------
export function matchPieceMove(s: string): SanCandidates | undefined {
  const res1 = [new RegExp(`^${PIECE_RE_S} ${SQUARE_RE_S}$`), new RegExp(`^${PIECE_RE_S} ${W_TO} ${SQUARE_RE_S}$`)];
  const matches1 = res1.map((re) => re.exec(s));
  const match1 = matches1.find((x) => x !== null);
  if (match1) {
    const san =
      match1[1] === 'P'
        ? defaultPromotion(`${match1[2]}${match1[3]}`, match1[3])
        : `${match1[1].toUpperCase()}${match1[2]}${match1[3]}`;

    // Check if this could also be a rank-disambiguated move (e.g. "r 2 d 3" could be Rd3 or R2d3)
    const rankAmbiguityRe = new RegExp(`^${PIECE_RE_S} ${RANK_RE_S} ${SQUARE_RE_S}$`);
    const rankMatch = rankAmbiguityRe.exec(s);
    if (rankMatch && rankMatch[1] !== 'P') {
      const altSan = `${rankMatch[1].toUpperCase()}${rankMatch[2]}${rankMatch[3]}${rankMatch[4]}`;
      return { candidates: [san, altSan] };
    }

    return { candidates: [san] };
  }

  const res2 = [
    new RegExp(`^${PIECE_RE_S} ${W_TAKES} ${SQUARE_RE_S}$`),
    new RegExp(`^${PIECE_RE_S} ${W_CAPTURES} ${SQUARE_RE_S}$`),
  ];
  const matches2 = res2.map((re) => re.exec(s));
  const match2 = matches2.find((x) => x !== null);
  if (match2) {
    if (match2[1] === 'P') {
      // Pawn captures require a source file; generate candidates from adjacent files
      const targetFile = match2[2];
      const targetRank = match2[3];
      const candidates = adjacentFiles(targetFile).map((f) =>
        defaultPromotion(`${f}x${targetFile}${targetRank}`, targetRank)
      );
      if (candidates.length === 0) return undefined;
      return { candidates: candidates as unknown as NonEmptyReadonlyArray<SAN> };
    }
    return { candidates: [`${match2[1].toUpperCase()}x${match2[2]}${match2[3]}`] };
  }

  const res3 = [
    new RegExp(`^${PIECE_RE_S} ${FILE_RE_S} ${SQUARE_RE_S}$`),
    new RegExp(`^${PIECE_RE_S} ${FILE_RE_S} ${W_TO} ${SQUARE_RE_S}$`),
    new RegExp(`^${PIECE_RE_S} ${RANK_RE_S} ${SQUARE_RE_S}$`),
    new RegExp(`^${PIECE_RE_S} ${RANK_RE_S} ${W_TO} ${SQUARE_RE_S}$`),
  ];
  const matches3 = res3.map((re) => re.exec(s));
  const match3 = matches3.find((x) => x !== null);
  if (match3) {
    return { candidates: [`${match3[1].toUpperCase()}${match3[2]}${match3[3]}${match3[4]}`] };
  }

  const res4 = [
    new RegExp(`^${PIECE_RE_S} ${FILE_RE_S} ${W_TAKES} ${SQUARE_RE_S}$`),
    new RegExp(`^${PIECE_RE_S} ${FILE_RE_S} ${W_CAPTURES} ${SQUARE_RE_S}$`),

    new RegExp(`^${PIECE_RE_S} ${RANK_RE_S} ${W_TAKES} ${SQUARE_RE_S}$`),
    new RegExp(`^${PIECE_RE_S} ${RANK_RE_S} ${W_CAPTURES} ${SQUARE_RE_S}$`),
  ];
  const matches4 = res4.map((re) => re.exec(s));
  const match4 = matches4.find((x) => x !== null);
  if (match4) {
    return { candidates: [`${match4[1].toUpperCase()}${match4[2]}x${match4[3]}${match4[4]}`] };
  }

  return undefined;
}

// --------------------------------------------------------------------------
export function matchCoordMove(s: string): [Square, Square] | undefined {
  const res1 = [
    new RegExp(`^${SQUARE_RE_S} ${W_TO} ${SQUARE_RE_S}$`),
    new RegExp(`^${SQUARE_RE_S} ${W_TAKES} ${SQUARE_RE_S}$`),
    new RegExp(`^${SQUARE_RE_S} ${W_CAPTURES} ${SQUARE_RE_S}$`),
  ];
  const matches1 = res1.map((re) => re.exec(s));
  const match1 = matches1.find((x) => x !== null);
  return match1 ? ([`${match1[1]}${match1[2]}`, `${match1[3]}${match1[4]}`] as [Square, Square]) : undefined;
}

// --------------------------------------------------------------------------
export function matchCastleMove(s: string): SanCandidates | undefined {
  const res1 = [
    new RegExp(`^${W_CASTLE} ${W_KING_SIDE}$`),
    new RegExp(`^${W_KING_SIDE} ${W_CASTLE}$`),
    new RegExp(`^${W_SHORT} ${W_CASTLE}$`),
    new RegExp(`^${W_CASTLE} ${W_SHORT}$`),
  ];
  const matches1 = res1.map((re) => re.exec(s));
  const match1 = matches1.find((x) => x !== null);
  if (match1) {
    return { candidates: ['O-O'] };
  }

  const res2 = [
    new RegExp(`^${W_CASTLE} ${W_QUEEN_SIDE}$`),
    new RegExp(`^${W_QUEEN_SIDE} ${W_CASTLE}$`),
    new RegExp(`^${W_LONG} ${W_CASTLE}$`),
    new RegExp(`^${W_CASTLE} ${W_LONG}$`),
  ];
  const matches2 = res2.map((re) => re.exec(s));
  const match2 = matches2.find((x) => x !== null);
  if (match2) {
    return { candidates: ['O-O-O'] };
  }

  return undefined;
}

// --------------------------------------------------------------------------
export function matchMove(s: string): SanCandidates | [Square, Square] | ControlAction | undefined {
  // eslint-disable-next-line fp/no-loops
  for (const matcherFn of [
    matchControlInstruction,
    matchPawnMove,
    matchPieceMove,
    matchCoordMove,
    matchCastleMove,
    matchPawnPromotionMove,
  ]) {
    const match = matcherFn(s);
    if (match) {
      return match;
    }
  }

  return undefined;
}

// --------------------------------------------------------------------------
export function parse(s: string): SanCandidates | [Square, Square] | ControlAction | undefined {
  return matchMove(sanitizeInputString(s));
}
