import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { ScoreSheet } from './index';

describe('ScoreSheet', () => {
  it('renders full-move rows with move numbers and pads to 10 rows', () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(
      () => (
        <ScoreSheet
          currentPly={2}
          onGoToPly={vi.fn()}
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
    const activeMoveButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'e5'
    ) as HTMLButtonElement | undefined;
    expect(activeMoveButton?.className).toContain('font-semibold');
    expect(activeMoveButton?.className).toContain('underline');
  });

  it('grows beyond 10 rows when the game is longer', () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(
      () => (
        <ScoreSheet
          currentPly={0}
          onGoToPly={vi.fn()}
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

  it('navigates to the clicked ply from white and black move buttons', () => {
    const root = document.createElement('div');
    const onGoToPly = vi.fn();
    document.body.append(root);

    render(
      () => (
        <ScoreSheet
          currentPly={0}
          onGoToPly={onGoToPly}
          scoresheet={[
            ['e4', 'e5'],
            ['Nf3', 'Nc6'],
          ]}
        />
      ),
      root
    );

    const whiteMoveButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Nf3'
    ) as HTMLButtonElement | undefined;
    const blackMoveButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Nc6'
    ) as HTMLButtonElement | undefined;

    whiteMoveButton?.click();
    blackMoveButton?.click();

    expect(onGoToPly).toHaveBeenNthCalledWith(1, 3);
    expect(onGoToPly).toHaveBeenNthCalledWith(2, 4);
  });
});
