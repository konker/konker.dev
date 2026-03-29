import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./ChessBoard', () => ({
  ChessBoard: () => <div data-testid="mock-chess-board">Mock ChessBoard</div>,
}));

import { ChessOMaticApp } from './ChessOMaticApp';

describe('ChessOMaticApp', () => {
  it('renders the SolidStart app shell without booting the chess engine in tests', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(() => ChessOMaticApp({ autoloadEngine: false }), root);
    await Promise.resolve();

    expect(root.textContent).toContain('Chess-o-Matic');
    expect(root.textContent).toContain('Enable Audio Input');
    expect(root.textContent).toContain('Enable Audio Output');
    expect(root.textContent).toContain('PGN');
    expect(root.textContent).toContain('Status');
    expect(root.textContent).toContain('Heard');
    expect(root.querySelector('[data-testid="mock-chess-board"]')).not.toBeNull();
    expect((root.querySelector('[aria-label="Last Input Message"]') as HTMLElement | null)?.textContent).toContain(
      'Component test mode'
    );
  });
});
