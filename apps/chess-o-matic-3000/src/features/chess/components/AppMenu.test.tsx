import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@kobalte/core', () => {
  const DialogRoot = (props: { children: unknown }) => <>{props.children}</>;
  const DialogTrigger = (props: Record<string, unknown>) => <button {...props}>{props.children as never}</button>;
  const DialogPortal = (props: { children: unknown }) => <>{props.children}</>;
  const DialogOverlay = (props: Record<string, unknown>) => <div {...props} />;
  const DialogContent = (props: Record<string, unknown>) => <div {...props}>{props.children as never}</div>;
  const DialogTitle = (props: Record<string, unknown>) => <div {...props}>{props.children as never}</div>;
  const DialogCloseButton = (props: Record<string, unknown>) => <button {...props}>{props.children as never}</button>;

  return {
    Dialog: {
      Root: DialogRoot,
      Trigger: DialogTrigger,
      Portal: DialogPortal,
      Overlay: DialogOverlay,
      Content: DialogContent,
      Title: DialogTitle,
      CloseButton: DialogCloseButton,
    },
  };
});

vi.mock('@solidjs/router', () => ({
  useLocation: () => ({
    pathname: '/',
  }),
}));

import { AppMenu } from './AppMenu';

describe('AppMenu', () => {
  it('opens a drawer and dispatches menu actions', async () => {
    const root = document.createElement('div');
    const onGoToHistory = vi.fn();
    const onNewGame = vi.fn();
    document.body.append(root);

    render(() => <AppMenu onGoToHistory={onGoToHistory} onNewGame={onNewGame} />, root);
    await Promise.resolve();

    const trigger = root.querySelector('button[aria-label="Open menu"]') as HTMLButtonElement | null;
    trigger?.click();
    await Promise.resolve();

    expect(document.body.textContent).toContain('New Game');
    expect(document.body.textContent).toContain('History');

    const historyButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('History')
    ) as HTMLButtonElement | undefined;

    historyButton?.click();
    await Promise.resolve();

    expect(onGoToHistory).toHaveBeenCalledTimes(1);
  });
});
