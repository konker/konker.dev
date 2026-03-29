import { render } from 'solid-js/web';
import { describe, expect, it } from 'vitest';

import { ScoreSheet } from './index';

describe('ScoreSheet', () => {
  it('renders full-move rows with move numbers', () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(
      () => (
        <ScoreSheet
          scoresheet={[
            ['e4', 'e5'],
            ['Nf3', 'Nc6'],
            ['Bb5', '*'],
          ]}
        />
      ),
      root
    );

    expect(root.textContent).toContain('1.');
    expect(root.textContent).toContain('e4');
    expect(root.textContent).toContain('e5');
    expect(root.textContent).toContain('2.');
    expect(root.textContent).toContain('Nf3');
    expect(root.textContent).toContain('Nc6');
    expect(root.textContent).toContain('3.');
    expect(root.textContent).toContain('Bb5');
    expect(root.textContent).not.toContain('*');
  });
});
