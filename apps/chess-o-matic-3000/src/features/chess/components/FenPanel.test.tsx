import { render } from 'solid-js/web';
import { describe, expect, it } from 'vitest';

import { FenPanel } from './FenPanel';

describe('FenPanel', () => {
  it('shows the raw FEN text', () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(() => <FenPanel fen={'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'} />, root);

    expect((root.querySelector('[aria-label="FEN"]') as HTMLDivElement | null)?.textContent).toContain(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );
    expect(root.textContent).not.toContain('Copy FEN');
  });
});
