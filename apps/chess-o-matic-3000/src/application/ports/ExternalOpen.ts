import type { GameRecord } from '../../domain/game/types';

export type ExternalOpen = {
  readonly openChessDotCom: (game: GameRecord) => Promise<void>;
  readonly openLichess: (game: GameRecord) => Promise<void>;
};
