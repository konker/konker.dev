import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';

import type { GameModelResources } from '../../game-model';
import { GAME_MODEL_EVENT_TYPE_VIEW_CHANGED, gameModelEventsNotifyListeners } from '../../game-model/events.js';

// --------------------------------------------------------------------------
export function moveHighlight(rep: GChessBoardElement, coords: [Square, Square]): void {
  const [from, to] = coords;

  // Remove the attribute from any square that currently has it
  rep.shadowRoot?.querySelectorAll('[last-move]')?.forEach((sq) => sq.removeAttribute('last-move'));

  // Find the new squares and add the attribute
  const fromSq = rep.shadowRoot?.querySelector(`[data-square="${from}"]`);
  const toSq = rep.shadowRoot?.querySelector(`[data-square="${to}"]`);

  if (fromSq) fromSq.setAttribute('last-move', '');
  if (toSq) toSq.setAttribute('last-move', '');
}

// --------------------------------------------------------------------------
export async function moveComplete(
  gameModelResources: GameModelResources,
  rep: GChessBoardElement,
  coords: [Square, Square],
  san?: string
): Promise<void> {
  await gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_VIEW_CHANGED, {
    type: GAME_MODEL_EVENT_TYPE_VIEW_CHANGED,
    move: san ?? coords,
  });
  rep.fen = gameModelResources.chess.fen();
  rep.turn = gameModelResources.chess.turn() === 'w' ? 'white' : 'black';
  moveHighlight(rep, coords);
  gameModelResources.locked = false;
}
