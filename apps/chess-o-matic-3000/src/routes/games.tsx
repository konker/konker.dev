import { Title } from '@solidjs/meta';
import { useNavigate } from '@solidjs/router';
import type { JSX } from 'solid-js';
import { createSignal, For, onMount, Show } from 'solid-js';

import { createBrowserGameStorage } from '../application/adapters/browser/BrowserGameStorage';
import type { SavedGameSummary } from '../domain/game/types';
import { AppMenu } from '../features/chess/components/AppMenu';

function deriveHistoryTitle(game: SavedGameSummary): string {
  if (game.event.trim() !== '') {
    return game.event;
  }

  const white = game.white.trim();
  const black = game.black.trim();
  if (white !== '' || black !== '') {
    return `${white || 'White'} vs ${black || 'Black'}`;
  }

  if (game.date.trim() !== '') {
    return `Game on ${game.date}`;
  }

  return 'Untitled game';
}

function compareSavedGamesByDate(a: SavedGameSummary, b: SavedGameSummary): number {
  const primaryA = Date.parse(a.date) || Date.parse(a.updatedAt) || Date.parse(a.createdAt) || 0;
  const primaryB = Date.parse(b.date) || Date.parse(b.updatedAt) || Date.parse(b.createdAt) || 0;
  return primaryB - primaryA;
}

export default function GamesPage(): JSX.Element {
  const navigate = useNavigate();
  const gameStorage = createBrowserGameStorage();
  const [games, setGames] = createSignal<Array<SavedGameSummary>>([]);

  async function loadHistory(): Promise<void> {
    const index = await gameStorage.loadSavedGameIndex();
    setGames([...index.savedGames].sort(compareSavedGamesByDate));
  }

  async function discardGame(gameId: string): Promise<void> {
    await gameStorage.deleteGame(gameId);
    setGames((current) => current.filter((game) => game.id !== gameId));
  }

  function openGame(gameId: string): void {
    void navigate(`/?gameId=${encodeURIComponent(gameId)}`);
  }

  onMount(() => {
    void loadHistory();
  });

  return (
    <>
      <Title>History | Chess-o-matic 3000</Title>
      <main class="app-shell">
        <header class="app-header">
          <div class="app-header-top">
            <div class="flex flex-col gap-2">
              <span class="app-eyebrow">Saved games</span>
              <h1 class="app-title">History</h1>
            </div>
            <AppMenu onGoToHistory={() => undefined} onNewGame={() => void navigate('/?newGame=1')} />
          </div>
          <div class="app-control-row">
            <button class="toolbar-button" onClick={() => void navigate('/')} type="button">
              Back to game
            </button>
          </div>
        </header>

        <section class="panel flex flex-col gap-3">
          <Show when={games().length > 0} fallback={<p class="text-sm text-[var(--color-text-secondary)]">No saved games yet.</p>}>
            <For each={games()}>
              {(game) => (
                <article class="flex flex-col gap-3 border p-4" style={{ 'border-color': 'var(--color-border-subtle)' }}>
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <button class="text-left text-lg font-medium" onClick={() => openGame(game.id)} type="button">
                      {deriveHistoryTitle(game)}
                    </button>
                    <div class="toolbar-group">
                      <button class="toolbar-button" onClick={() => openGame(game.id)} type="button">
                        Open
                      </button>
                      <button class="toolbar-button toolbar-button-danger" onClick={() => void discardGame(game.id)} type="button">
                        Discard
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-secondary)]">
                    <span>{game.date || 'Undated game'}</span>
                    <span>{game.white || 'White'} vs {game.black || 'Black'}</span>
                    <span>{game.moveCount} moves</span>
                  </div>
                </article>
              )}
            </For>
          </Show>
        </section>
      </main>
    </>
  );
}
