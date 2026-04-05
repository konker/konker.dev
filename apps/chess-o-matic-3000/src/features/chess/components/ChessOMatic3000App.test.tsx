import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@solidjs/router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    pathname: '/',
  }),
}));

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

vi.mock('./ChessBoard', () => ({
  ChessBoard: () => <div data-testid="mock-chess-board">Mock ChessBoard</div>,
}));

import { ChessOMatic3000App } from './ChessOMatic3000App';

describe('ChessOMatic3000App', () => {
  it('renders the SolidStart app shell without booting the chess engine in tests', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(() => ChessOMatic3000App({ autoloadEngine: false }), root);
    await Promise.resolve();

    expect(root.textContent).toContain('Chess-o-matic 3000');
    expect(root.querySelector('button[aria-label="Open menu"]')).not.toBeNull();
    expect(root.querySelector('button[aria-label="Copy PGN"]')).not.toBeNull();
    expect(root.querySelector('button[aria-label="Copy FEN"]')).not.toBeNull();
    expect(root.textContent).toContain('Lichess');
    expect(root.textContent).toContain('Chess.com');
    expect(root.querySelector('button[aria-label="Speech"]')).not.toBeNull();
    expect(root.querySelector('button[aria-label="Sounds"]')).not.toBeNull();
    expect(root.textContent).toContain('PGN');
    expect(root.textContent).toContain('Heard');
    expect(root.querySelector('[data-testid="mock-chess-board"]')).not.toBeNull();
    expect(
      (root.querySelector('[aria-label="Last Input Evaluate Status"]') as HTMLElement | null)?.textContent
    ).toContain('Component test mode');
  });
});
