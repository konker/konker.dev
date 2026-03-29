import type { Chess } from 'chess.js';

import type { GameMetadataData } from '../features/chess/components/GameMetadata/types';

const PGN_TAG_MAPPINGS = [
  ['Event', 'event'],
  ['Site', 'site'],
  ['Date', 'date'],
  ['Round', 'round'],
  ['TimeControl', 'timeControl'],
  ['White', 'white.name'],
  ['WhiteElo', 'white.elo'],
  ['Black', 'black.name'],
  ['BlackElo', 'black.elo'],
] as const;

export function applyGameMetadata(chess: Chess, metadata: GameMetadataData): void {
  PGN_TAG_MAPPINGS.forEach(([tagName, fieldPath]) => {
    const value = resolveMetadataField(metadata, fieldPath);

    if (value === '') {
      chess.removeHeader(tagName);
      return;
    }

    chess.setHeader(tagName, value);
  });
}

function resolveMetadataField(metadata: GameMetadataData, fieldPath: (typeof PGN_TAG_MAPPINGS)[number][1]): string {
  switch (fieldPath) {
    case 'event':
      return metadata.event;
    case 'site':
      return metadata.site;
    case 'date':
      return metadata.date;
    case 'round':
      return metadata.round;
    case 'timeControl':
      return metadata.timeControl;
    case 'white.name':
      return metadata.white.name;
    case 'white.elo':
      return metadata.white.elo;
    case 'black.name':
      return metadata.black.name;
    case 'black.elo':
      return metadata.black.elo;
  }
}
