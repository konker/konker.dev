import { History, Home, Menu, PlusSquare } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createSignal, Show } from 'solid-js';

type AppMenuProps = {
  readonly onGoHome: () => void;
  readonly onGoToHistory: () => void;
  readonly onNewGame: () => void;
};

export function AppMenu(props: AppMenuProps): JSX.Element {
  const [isOpen, setIsOpen] = createSignal(false);

  function handleMenuAction(action: () => void): void {
    setIsOpen(false);
    action();
  }

  return (
    <div class="relative">
      <button
        aria-expanded={isOpen()}
        aria-haspopup="menu"
        aria-label="Open menu"
        class="toolbar-icon-button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Menu class="h-5 w-5" />
      </button>

      <Show when={isOpen()}>
        <div
          class="absolute right-0 top-12 z-20 flex min-w-44 flex-col border bg-[var(--color-bg-panel)] p-2 shadow-sm"
          role="menu"
        >
          <button class="toolbar-button justify-start border-0" onClick={() => handleMenuAction(props.onGoHome)} role="menuitem" type="button">
            <Home class="h-4 w-4" />
            <span>Home</span>
          </button>
          <button class="toolbar-button justify-start border-0" onClick={() => handleMenuAction(props.onNewGame)} role="menuitem" type="button">
            <PlusSquare class="h-4 w-4" />
            <span>New Game</span>
          </button>
          <button
            class="toolbar-button justify-start border-0"
            onClick={() => handleMenuAction(props.onGoToHistory)}
            role="menuitem"
            type="button"
          >
            <History class="h-4 w-4" />
            <span>History</span>
          </button>
        </div>
      </Show>
    </div>
  );
}
