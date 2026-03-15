export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Coord = `${File}${Rank}`;

export type BoardView = {
  readonly move: (orig: Coord, dest: Coord, fen: string) => void;
  readonly toggleOrientation: () => void;
};

export type BoardViewAdapter = (boardEl: HTMLElement) => BoardView;
