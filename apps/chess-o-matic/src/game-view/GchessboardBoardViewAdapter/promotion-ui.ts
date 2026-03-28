import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';

import type { GameModelResources } from '../../game-model';
import { moveComplete } from './helpers.js';

// --------------------------------------------------------------------------
export function openPromotionDialog(
  gameModelResources: GameModelResources,
  rep: GChessBoardElement,
  promotionDialogEl: HTMLElement,
  coords: [Square, Square],
  color: 'b' | 'w'
) {
  promotionDialogEl.setAttribute('data-open', 'true');

  const choices = promotionDialogEl.querySelectorAll('.promo-choice');
  choices.forEach((el: any) => {
    const role = el.dataset.piece;

    // Apply the correct color class for your custom CSS
    el.className = `promo-choice ${color === 'w' ? 'white-' : 'black-'}${role}`;

    // Handle the selection
    el.onclick = async () => {
      promotionDialogEl.setAttribute('data-open', 'false');

      const san = coords[0].startsWith(coords[1][0])
        ? // Pawn push
          `${coords[1]}=${role.toUpperCase()}`
        : // Pawn capture
          `${coords[0][0]}x${coords[1]}=${role.toUpperCase()}`;

      await moveComplete(gameModelResources, rep, coords, san);
    };
  });
}
