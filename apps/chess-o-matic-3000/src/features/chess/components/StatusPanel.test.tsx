import { render } from 'solid-js/web';
import { describe, expect, it } from 'vitest';

import { StatusPanel } from './StatusPanel';

describe('StatusPanel', () => {
  it('renders a dedicated game-over summary when the game has ended', () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(
      () => (
        <StatusPanel
          currentMoveColor="white"
          currentMoveNumber={3}
          gameOverReason="Checkmate"
          gameResult="0-1"
          isGameOver
          lastMoveSan="Qh4#"
          message="Qh4#"
          sanitizedInput="Qh4 mate"
          status="ok"
        />
      ),
      root
    );

    expect(root.querySelector('[aria-label="Game Over Summary"]')?.textContent).toContain('Game over');
    expect(root.querySelector('[aria-label="Game Over Summary"]')?.textContent).toContain('Checkmate');
    expect(root.querySelector('[aria-label="Game Result"]')?.textContent).toBe('0-1');
    expect(root.textContent).toContain('Last Input');
  });
});
