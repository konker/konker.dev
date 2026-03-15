import 'gchessboard';
import './styles.css';

import { START_FEN } from 'chessboard-element';
import type { GChessBoardElement } from 'gchessboard';

import type { BoardViewAdapter, Coord } from '../types';

export const GchessboardBoardViewAdapter: BoardViewAdapter = (boardEl: HTMLElement) => {
  const rep = document.createElement('g-chess-board') as GChessBoardElement;
  rep.coordinates = 'outside';
  rep.fen = START_FEN;
  boardEl.replaceChildren(rep);

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

  return {
    move: (orig: Coord, dest: Coord, fen: string) => {
      rep.fen = fen;
      // Remove the attribute from any square that currently has it
      console.log('KONK90', rep.shadowRoot?.querySelectorAll('[last-move]'));
      rep.shadowRoot?.querySelectorAll('[last-move]')?.forEach((sq) => sq.removeAttribute('last-move'));

      // Find the new squares and add the attribute
      const fromSq = rep.shadowRoot?.querySelector(`[data-square="${orig}"]`);
      const toSq = rep.shadowRoot?.querySelector(`[data-square="${dest}"]`);

      console.log('KONK91', `[data-square="${orig}"]`, fromSq, `[square="${dest}"]`, toSq);

      if (fromSq) fromSq.setAttribute('last-move', '');
      if (toSq) toSq.setAttribute('last-move', '');
    },
    toggleOrientation: () => (rep.orientation = rep.orientation === 'white' ? 'black' : 'white'),
  };
};
