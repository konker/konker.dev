import { Dialog } from '@kobalte/core';
import { useLocation } from '@solidjs/router';
import { History, Menu, PlusSquare, X } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createSignal } from 'solid-js';

type AppMenuProps = {
  readonly onGoToHistory: () => void;
  readonly onNewGame: () => void;
};

export function AppMenu(props: AppMenuProps): JSX.Element {
  const location = useLocation();
  const [isOpen, setIsOpen] = createSignal(false);

  function handleMenuAction(action: () => void): void {
    setIsOpen(false);
    action();
  }

  function isCurrentNavigationItem(_item: 'history'): boolean {
    const pathname = location.pathname;

    return pathname === '/games';
  }

  return (
    <Dialog.Root modal onOpenChange={setIsOpen} open={isOpen()}>
      <Dialog.Trigger aria-label="Open menu" class="toolbar-icon-button app-menu-trigger" type="button">
        <Menu class="h-5 w-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="app-drawer-overlay" />
        <Dialog.Content class="app-drawer-content">
          <div class="app-drawer-header">
            <Dialog.Title class="sr-only">Menu</Dialog.Title>
            <Dialog.CloseButton aria-label="Close menu" class="toolbar-icon-button ml-auto" type="button">
              <span class="sr-only">Close</span>
              <X aria-hidden="true" class="h-5 w-5" />
            </Dialog.CloseButton>
          </div>
          <nav class="app-drawer-nav" role="menu">
            <button
              class={`app-drawer-item ${isCurrentNavigationItem('history') ? 'app-drawer-item-active' : ''}`}
              onClick={() => handleMenuAction(props.onGoToHistory)}
              role="menuitem"
              type="button"
            >
              <History class="h-4 w-4" />
              <span>History</span>
            </button>
            <div class="app-drawer-actions">
              <button
                class="toolbar-button toolbar-button-cobalt justify-start"
                onClick={() => handleMenuAction(props.onNewGame)}
                role="menuitem"
                type="button"
              >
                <PlusSquare class="h-4 w-4" />
                <span>New Game</span>
              </button>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
