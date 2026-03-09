export const SHORT_CASTLE_TERMS = [
  'castle king side',
  'castle kingside',
  'king side castle',
  'kingside castle',
  'short castle',
] as const;

export const LONG_CASTLE_TERMS = [
  'castle queen side',
  'castle queenside',
  'queen side castle',
  'queenside castle',
  'long castle',
] as const;

export const PROMOTION_TERMS = [' promotion', 'promote to ', 'promotes to ', 'promotion '] as const;

export const WORD_TO_DIGIT = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
} as const;

export const WORD_TO_PIECE = {
  knight: 'N',
  bishop: 'B',
  rook: 'R',
  queen: 'Q',
  king: 'K',
  pawn: '',
} as const;
