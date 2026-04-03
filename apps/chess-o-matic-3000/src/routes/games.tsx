import { Title } from '@solidjs/meta';
import { useNavigate } from '@solidjs/router';
import { ArrowLeft, FolderOpen, ScrollText, Trash2 } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createSignal, For, onMount, Show } from 'solid-js';

import { createBrowserGameStorage } from '../application/adapters/browser/BrowserGameStorage';
import type { GameRecord } from '../domain/game/types';
import type { SavedGameSummary } from '../domain/game/types';
import { AppFooter } from '../features/chess/components/AppFooter';
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

function resolveEditedHistoryTitle(game: SavedGameSummary, nextTitle: string): string {
  const trimmedTitle = nextTitle.trim();

  if (trimmedTitle !== '') {
    return trimmedTitle;
  }

  return deriveHistoryTitle({
    ...game,
    event: '',
  });
}

type HistoryGameCardProps = {
  readonly game: SavedGameSummary;
  readonly onDiscard: (gameId: string) => Promise<void>;
  readonly onOpen: (gameId: string) => void;
  readonly onRename: (gameId: string, nextTitle: string) => Promise<void>;
};

function HistoryGameCard(props: HistoryGameCardProps): JSX.Element {
  let titleInputRef: HTMLInputElement | undefined;
  const [displayTitle, setDisplayTitle] = createSignal(deriveHistoryTitle(props.game));
  const [draftTitle, setDraftTitle] = createSignal(displayTitle());
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);

  function beginEditingTitle(): void {
    setDraftTitle(displayTitle());
    setIsEditingTitle(true);
    queueMicrotask(() => {
      titleInputRef?.focus();
      titleInputRef?.select();
    });
  }

  async function commitTitleEdit(): Promise<void> {
    if (!isEditingTitle()) {
      return;
    }

    setIsEditingTitle(false);
    setDisplayTitle(resolveEditedHistoryTitle(props.game, draftTitle()));
    await props.onRename(props.game.id, draftTitle());
  }

  function cancelTitleEdit(): void {
    setDraftTitle(displayTitle());
    setIsEditingTitle(false);
  }

  return (
    <article class="history-card">
      <div class="history-card-header">
        <div class="history-title-row">
          <ScrollText class="history-title-icon" />
          <Show
            when={isEditingTitle()}
            fallback={
              <button class="history-title-trigger" onClick={beginEditingTitle} type="button">
                <span class="history-title-text">{displayTitle()}</span>
              </button>
            }
          >
            <input
              aria-label={`Edit title for ${displayTitle()}`}
              class="history-title-input"
              onBlur={() => void commitTitleEdit()}
              onInput={(event) => setDraftTitle(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.currentTarget.blur();
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelTitleEdit();
                }
              }}
              ref={titleInputRef}
              type="text"
              value={draftTitle()}
            />
          </Show>
        </div>
        <div class="toolbar-group">
          <button class="toolbar-button" onClick={() => props.onOpen(props.game.id)} type="button">
            <FolderOpen class="h-4 w-4" />
            <span>Open</span>
          </button>
          <button class="toolbar-button toolbar-button-danger" onClick={() => void props.onDiscard(props.game.id)} type="button">
            <Trash2 class="h-4 w-4" />
            <span>Discard</span>
          </button>
        </div>
      </div>
      <div class="history-meta">
        <span>{props.game.date || 'Undated game'}</span>
        <span>{props.game.white || 'White'} vs {props.game.black || 'Black'}</span>
        <span>{props.game.moveCount} moves</span>
      </div>
    </article>
  );
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

  async function renameGameTitle(gameId: string, nextTitle: string): Promise<void> {
    const existingGame = await gameStorage.loadGame(gameId);

    if (!existingGame) {
      return;
    }

    const updatedGame: GameRecord = {
      ...existingGame,
      metadata: {
        ...existingGame.metadata,
        event: nextTitle.trim(),
      },
      updatedAt: new Date().toISOString(),
    };

    await gameStorage.saveGame(updatedGame);
    setGames((current) =>
      [...current]
        .map((game) =>
          game.id === gameId
            ? {
                ...game,
                event: updatedGame.metadata.event,
                updatedAt: updatedGame.updatedAt,
              }
            : game
        )
        .sort(compareSavedGamesByDate)
    );
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
              <span class="app-eyebrow">Chess game recorder</span>
              <button aria-label="Go to home" class="app-title text-left" onClick={() => void navigate('/')} type="button">
                Chess-o-matic 3000
              </button>
            </div>
            <AppMenu onGoHome={() => void navigate('/')} onGoToHistory={() => undefined} onNewGame={() => void navigate('/?newGame=1')} />
          </div>
        </header>

        <header class="flex items-center justify-between gap-3">
          <p class="history-page-subtitle">History</p>
          <button class="toolbar-button" onClick={() => void navigate('/')} type="button">
            <ArrowLeft class="h-4 w-4" />
            <span>Back to game</span>
          </button>
        </header>

        <section class="panel flex flex-col gap-3">
          <Show when={games().length > 0} fallback={<p class="text-sm text-[var(--color-text-secondary)]">No saved games yet.</p>}>
            <For each={games()}>
              {(game) => (
                <HistoryGameCard game={game} onDiscard={discardGame} onOpen={openGame} onRename={renameGameTitle} />
              )}
            </For>
          </Show>
        </section>

        <AppFooter />
      </main>
    </>
  );
}
