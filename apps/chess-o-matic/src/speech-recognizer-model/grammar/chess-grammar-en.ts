export const chessGrammarControlActions = ['undo', 'flip', 'resign'] as const;
export type ChessGrammarControlAction = (typeof chessGrammarControlActions)[number];

export const chessGrammarFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export type ChessGrammarFile = (typeof chessGrammarFiles)[number];

export const chessGrammarRanks = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'] as const;
export type ChessGrammarRank = (typeof chessGrammarRanks)[number];

export const chessGrammaPieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'] as const;
export type ChessGrammarPiece = (typeof chessGrammaPieces)[number];

export const chessGrammarPieceSymbols = ['p', 'n', 'b', 'r', 'q', 'k'] as const;
export type ChessGrammarPieceSymbol = (typeof chessGrammarPieceSymbols)[number];

export const chessGrammarConnectors = [
  'move',
  'from',
  'to', // ambiguous with '2'
  'takes',
  'x',
  'captures',
  'castle',
  'kingside',
  'queenside',
  'side',
  'short',
  'long',
  'check',
  'checkmate',
  'mate',
  'draw',
  'promote',
  'promotes',
  'promotion',
  'en passant',
] as const;
export type ChessGrammarConnector = (typeof chessGrammarConnectors)[number];

export const chessGrammar: Array<string> = [
  '[unk]',
  ...chessGrammarControlActions,
  ...chessGrammarRanks,
  ...chessGrammarFiles,
  ...chessGrammaPieces,
  ...chessGrammarPieceSymbols,
  ...chessGrammarConnectors,
] as const;
