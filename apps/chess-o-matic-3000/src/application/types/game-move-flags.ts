export type GameMoveFlags = {
  readonly isBottomMove: boolean;
  readonly isCapture: boolean;
  readonly isCastle: boolean;
  readonly isCheck: boolean;
  readonly isCheckmate: boolean;
  readonly isDraw: boolean;
  readonly isEnd: boolean;
  readonly isPromotion: boolean;
};

export const DEFAULT_GAME_MOVE_FLAGS: GameMoveFlags = {
  isBottomMove: true,
  isCapture: false,
  isCastle: false,
  isCheck: false,
  isCheckmate: false,
  isDraw: false,
  isEnd: false,
  isPromotion: false,
} as const;
