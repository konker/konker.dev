import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';

import type { GameModelResources } from '../../game-model';
import { moveComplete } from './helpers.js';

// --------------------------------------------------------------------------
export function openPromotionDialog(
  gameModelResources: GameModelResources,
  rep: GChessBoardElement,
  coords: [Square, Square],
  color: 'b' | 'w'
) {
  const promoDialog = document.getElementById('promotion-dialog');
  promoDialog!.style.display = 'flex';

  const choices = promoDialog!.querySelectorAll('.promo-choice');
  choices.forEach((el: any) => {
    const role = el.dataset.piece;

    // Apply the correct color class for your custom CSS
    el.className = `promo-choice ${color === 'w' ? 'white-' : 'black-'}${role}`;

    // Handle the selection
    el.onclick = async () => {
      promoDialog!.style.display = 'none';

      const san = coords[0].startsWith(coords[1][0])
        ? // Pawn push
          `${coords[1]}=${role.toUpperCase()}`
        : // Pawn capture
          `${coords[0][0]}x${coords[1]}=${role.toUpperCase()}`;

      await moveComplete(gameModelResources, rep, coords, san);
    };
  });
}
