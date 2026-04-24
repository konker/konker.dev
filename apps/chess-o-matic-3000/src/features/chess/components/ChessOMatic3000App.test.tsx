import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

const chessKeyboardMock = vi.fn((props: Record<string, unknown>) => (
  <div
    class="chess-keyboard-root"
    data-legal-moves={(props.legalMovesSan as ReadonlyArray<string> | undefined)?.join(',') ?? ''}
    data-orientation={(props.orientation as string | undefined) ?? ''}
  >
    Mock ChessKeyboard
  </div>
));

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

vi.mock('@konker.dev/chess-o-matic-keyboard/solid/chess-keyboard.css', () => ({}));
vi.mock('@konker.dev/chess-o-matic-keyboard/solid', () => ({
  ChessKeyboard: (props: Record<string, unknown>) => chessKeyboardMock(props),
}));

import { ChessOMatic3000App } from './ChessOMatic3000App';

describe('ChessOMatic3000App', () => {
  it('renders the SolidStart app shell without booting the chess engine in tests', async () => {
    chessKeyboardMock.mockClear();
    const root = document.createElement('div');
    document.body.append(root);

    render(() => ChessOMatic3000App({ autoloadEngine: false }), root);
    await Promise.resolve();

    expect(root.textContent).toContain('Chess-o-matic');
    expect(root.querySelector('button[aria-label="Open menu"]')).not.toBeNull();
    expect(root.querySelector('button[aria-label="Copy PGN"]')).not.toBeNull();
    expect(root.querySelector('button[aria-label="Copy FEN"]')).not.toBeNull();
    expect(root.textContent).toContain('Lichess');
    expect(root.textContent).toContain('Chess.com');
    expect(root.querySelector('button[aria-label="Speech"]')).not.toBeNull();
    expect(root.querySelector('button[aria-label="Sounds"]')).not.toBeNull();
    expect(root.textContent).toContain('PGN');
    expect(root.textContent).toContain('Keyboard');
    expect(root.textContent).toContain('Last Input');
    const navigationRow = root.querySelector('.board-navigation-row');
    const statusPanel = root.querySelector('#status');
    const keyboardSection = root.querySelector('.chess-keyboard-root')?.closest('details');
    expect(navigationRow).not.toBeNull();
    expect(statusPanel).not.toBeNull();
    expect(keyboardSection).not.toBeNull();
    expect(navigationRow?.compareDocumentPosition(statusPanel as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(statusPanel?.compareDocumentPosition(keyboardSection as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(root.querySelector('[data-testid="mock-chess-board"]')).not.toBeNull();
    expect(root.querySelector('.chess-keyboard-root')).not.toBeNull();
    expect(chessKeyboardMock).toHaveBeenCalled();
    expect(root.querySelector('.chess-keyboard-root')?.getAttribute('data-legal-moves')).toBe('');
    expect(root.querySelector('.chess-keyboard-root')?.getAttribute('data-orientation')).toBe('');
    expect(
      (root.querySelector('[aria-label="Last Input Evaluate Status"]') as HTMLElement | null)?.textContent
    ).toContain('Component test mode');
  });
});
