import 'gchessboard';
import './styles.css';

import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';

import type { GameModelResources } from '../../game-model';
import { START_FEN } from '../../game-model/consts';
import { tick } from '../../index';
import type { BoardViewAdapter } from '../types';

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

export const GchessboardBoardViewAdapter: BoardViewAdapter = (
  gameModelResources: GameModelResources,
  boardEl: HTMLElement
) => {
  const rep = document.createElement('g-chess-board') as GChessBoardElement;
  rep.coordinates = 'outside';
  rep.turn = 'white';
  rep.interactive = true;
  rep.fen = START_FEN;

  // Inject last-move highlight styles into the shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    [data-square][data-square-color="light"][last-move] {
      background-color: rgba(205, 210, 106, 0.8) !important;
    }
    [data-square][data-square-color="dark"][last-move] {
      background-color: rgba(170, 162, 58, 0.8) !important;
    }
  `;
  requestAnimationFrame(() => {
    rep.shadowRoot?.appendChild(style);
  });

  rep.addEventListener('moveend', (e) => {
    console.log('KONK90', gameModelResources.isLegalMove([e.detail.from, e.detail.to]));
    if (!gameModelResources.isLegalMove([e.detail.from, e.detail.to])) {
      e.preventDefault();
    }
    console.log('KONK91', tick, `${e.detail.from} to ${e.detail.to}`);
    // tick(`${e.detail.from} to ${e.detail.to}`);

    /*
    const move = gameModelResources.chess.move({
      from: e.detail.from,
      to: e.detail.to,
    });
    if (move === null) {
      e.preventDefault();
    }
    moveHighlight(rep, e.detail.from, e.detail.to);
     */
  });

  rep.addEventListener('movefinished', (e) => {
    tick(`${e.detail.from} to ${e.detail.to}`);
    // rep.fen = gameModelResources.chess.fen();
    rep.turn = gameModelResources.chess.turn() === 'w' ? 'white' : 'black';

    console.log('Ra: ', gameModelResources.chess.ascii());
    console.log('Rp: ', gameModelResources.chess.pgn());
    console.log('Rf: ', gameModelResources.chess.fen());
  });

  boardEl.replaceChildren(rep);

  return {
    move: (coords: [Square, Square], fen: string) => {
      if (rep.fen !== fen) {
        rep.fen = fen;
      }
      moveHighlight(rep, coords);
    },
    toggleOrientation: () => (rep.orientation = rep.orientation === 'white' ? 'black' : 'white'),
  };
};
