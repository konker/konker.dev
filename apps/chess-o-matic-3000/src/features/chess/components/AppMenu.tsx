import { Dialog } from '@kobalte/core';
import { History, Home, Menu, PlusSquare } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createSignal } from 'solid-js';

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
    <Dialog.Root modal onOpenChange={setIsOpen} open={isOpen()}>
      <Dialog.Trigger
        aria-label="Open menu"
        class="toolbar-icon-button app-menu-trigger"
        type="button"
      >
        <Menu class="h-5 w-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="app-drawer-overlay" />
        <Dialog.Content class="app-drawer-content">
          <div class="app-drawer-header">
            <Dialog.Title class="app-drawer-title">Menu</Dialog.Title>
            <Dialog.CloseButton aria-label="Close menu" class="toolbar-icon-button" type="button">
              <span class="sr-only">Close</span>
              <span aria-hidden="true" class="text-lg leading-none">
                ×
              </span>
            </Dialog.CloseButton>
          </div>
          <nav class="app-drawer-nav" role="menu">
            <button class="toolbar-button justify-start" onClick={() => handleMenuAction(props.onGoHome)} role="menuitem" type="button">
              <Home class="h-4 w-4" />
              <span>Home</span>
            </button>
            <button class="toolbar-button justify-start" onClick={() => handleMenuAction(props.onNewGame)} role="menuitem" type="button">
              <PlusSquare class="h-4 w-4" />
              <span>New Game</span>
            </button>
            <button class="toolbar-button justify-start" onClick={() => handleMenuAction(props.onGoToHistory)} role="menuitem" type="button">
              <History class="h-4 w-4" />
              <span>History</span>
            </button>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
