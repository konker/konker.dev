export type PlayerMetadata = {
  readonly elo: string;
  readonly name: string;
};

export type GameMetadataData = {
  readonly black: PlayerMetadata;
  readonly date: string;
  readonly event: string;
  readonly round: string;
  readonly site: string;
  readonly termination: string;
  readonly timeControl: string;
  readonly white: PlayerMetadata;
};

export const GAME_METADATA_EMPTY: GameMetadataData = {
  black: {
    elo: '',
    name: '',
  },
  date: '',
  event: '',
  round: '',
  site: '',
  termination: '',
  timeControl: '',
  white: {
    elo: '',
    name: '',
  },
} as const;
