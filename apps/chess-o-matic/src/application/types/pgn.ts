export type PgnMoveListItem = {
  readonly moveNumber: number;
  readonly ply: number;
  readonly san: string;
  readonly side: 'white' | 'black';
};

export type PgnMoveListData = Array<PgnMoveListItem>;

export const PGN_MOVE_LIST_EMPTY: PgnMoveListData = [] as const;
