import { render } from 'solid-js/web';
import { describe, expect, it } from 'vitest';

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
    expect(root.textContent).toContain('Last Input / Result');
    expect((root.querySelector('[aria-label="Last Input / Result"]') as HTMLTextAreaElement | null)?.value).toContain(
      'Component test mode'
    );
  });
});
