import { render } from 'solid-js/web';
import { describe, expect, it } from 'vitest';

import { ScoreSheet } from './index';

describe('ScoreSheet', () => {
  it('renders full-move rows with move numbers and pads to 10 rows', () => {
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
    expect(root.querySelectorAll('[aria-label="Scoresheet Row"]')).toHaveLength(10);
    expect(root.textContent).toContain('10.');
  });

  it('grows beyond 10 rows when the game is longer', () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(
      () => (
        <ScoreSheet
          scoresheet={[
            ['e4', 'e5'],
            ['Nf3', 'Nc6'],
            ['Bb5', 'a6'],
            ['Ba4', 'Nf6'],
            ['O-O', 'Be7'],
            ['Re1', 'b5'],
            ['Bb3', 'd6'],
            ['c3', 'O-O'],
            ['h3', 'Nb8'],
            ['d4', 'Nbd7'],
            ['c4', 'c6'],
          ]}
        />
      ),
      root
    );

    expect(root.querySelectorAll('[aria-label="Scoresheet Row"]')).toHaveLength(11);
    expect(root.textContent).toContain('11.');
  });
});
