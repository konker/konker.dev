import { render } from 'solid-js/web';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameRecord, PersistedSavedGameIndex } from '../domain/game/types';

const { navigateMock, storageState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  storageState: {
    games: new Map<string, GameRecord>(),
    index: {
      savedGames: [],
      schemaVersion: 1,
    } as PersistedSavedGameIndex,
  },
}));

vi.mock('@solidjs/meta', () => ({
  Title: () => null,
}));

vi.mock('@solidjs/router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../features/chess/components/AppMenu', () => ({
  AppMenu: () => <div data-testid="mock-app-menu" />,
}));

vi.mock('../application/adapters/browser/BrowserGameStorage', () => ({
  createBrowserGameStorage: () => ({
    async deleteGame(gameId: string) {
      storageState.games.delete(gameId);
      storageState.index = {
        ...storageState.index,
        savedGames: storageState.index.savedGames.filter((game) => game.id !== gameId),
      };
    },
    async loadAppState() {
      return undefined;
    },
    async loadGame(gameId: string) {
      return storageState.games.get(gameId);
    },
    async loadSavedGameIndex() {
      return storageState.index;
    },
    async saveAppState() {
      return;
    },
    async saveGame(game: GameRecord) {
      storageState.games.set(game.id, game);
      storageState.index = {
        ...storageState.index,
        savedGames: [
          {
            black: game.metadata.black.name,
            createdAt: game.createdAt,
            date: game.metadata.date,
            event: game.metadata.event,
            id: game.id,
            moveCount: game.moveHistory.length,
            updatedAt: game.updatedAt,
            white: game.metadata.white.name,
          },
          ...storageState.index.savedGames.filter((savedGame) => savedGame.id !== game.id),
        ],
      };
    },
  }),
}));

import GamesPage from './games';

describe('GamesPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();

    const seedGame: GameRecord = {
      createdAt: '2026-04-03T00:00:00.000Z',
      currentPly: 2,
      id: 'game-1',
      metadata: {
        black: { elo: '', name: 'Black' },
        date: '2026-04-03',
        event: 'Club Night',
        result: '*',
        round: '',
        site: '',
        termination: '',
        timeControl: '',
        white: { elo: '', name: 'White' },
      },
      moveHistory: [
        { from: 'e2', san: 'e4', to: 'e4' },
        { from: 'e7', san: 'e5', to: 'e5' },
      ],
      orientation: 'white',
      schemaVersion: 1,
      status: 'in-progress',
      updatedAt: '2026-04-03T00:00:00.000Z',
    };

    storageState.games = new Map([[seedGame.id, seedGame]]);
    storageState.index = {
      savedGames: [
        {
          black: 'Black',
          createdAt: seedGame.createdAt,
          date: seedGame.metadata.date,
          event: seedGame.metadata.event,
          id: seedGame.id,
          moveCount: seedGame.moveHistory.length,
          updatedAt: seedGame.updatedAt,
          white: 'White',
        },
      ],
      schemaVersion: 1,
    };
  });

  it('edits the title inline and only opens via the Open button', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(() => <GamesPage />, root);
    await Promise.resolve();
    await Promise.resolve();

    const titleButton = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Club Night')
    ) as HTMLButtonElement | undefined;

    titleButton?.click();

    expect(navigateMock).not.toHaveBeenCalled();

    const titleInput = root.querySelector('input[aria-label*="Edit title"]') as HTMLInputElement | null;
    expect(titleInput).not.toBeNull();

    if (!titleInput) {
      return;
    }

    titleInput.value = 'Renamed Game';
    titleInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    titleInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    await Promise.resolve();

    expect(storageState.games.get('game-1')?.metadata.event).toBe('Renamed Game');
    expect(root.textContent).toContain('Renamed Game');

    const openButton = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Open')
    ) as HTMLButtonElement | undefined;

    openButton?.click();

    expect(navigateMock).toHaveBeenCalledWith('/?gameId=game-1');
  });
});
