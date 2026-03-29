import type { GameRecord } from '../../domain/game/types';

export function gameRecordToExportBaseName(game: GameRecord): string {
  const white = sanitizeSegment(game.metadata.white.name, 'white');
  const black = sanitizeSegment(game.metadata.black.name, 'black');
  const date = sanitizeSegment(game.createdAt.slice(0, 10), 'game');

  return `${white}-vs-${black}-${date}`;
}

function sanitizeSegment(value: string, fallback: string): string {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === '') {
    return fallback;
  }

  return trimmed
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/g, '')
    .replace(/-+$/g, '')
    .slice(0, 40);
}
