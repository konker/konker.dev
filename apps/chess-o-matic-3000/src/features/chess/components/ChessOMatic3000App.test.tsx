import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

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
    expect(root.textContent).toContain('Copy PGN');
    expect(root.textContent).toContain('Copy FEN');
    expect(root.textContent).toContain('Open in Lichess');
    expect(root.textContent).toContain('Open in Chess.com');
    expect(root.textContent).toContain('Speech');
    expect(root.textContent).toContain('Sounds');
    expect(root.textContent).toContain('PGN');
    expect(root.textContent).toContain('Heard');
    expect(root.querySelector('[data-testid="mock-chess-board"]')).not.toBeNull();
    expect((root.querySelector('[aria-label="Last Input Evaluate Status"]') as HTMLElement | null)?.textContent).toContain(
      'Component test mode'
    );
  });
});
