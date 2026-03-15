/* eslint-disable fp/no-this */
import 'gchessboard';
import './styles.css';

import type { Square } from 'chess.js';
import type { GChessBoardElement } from 'gchessboard';

import type { GameModelResources } from '../../game-model';
import { START_FEN } from '../../game-model/consts';
import { GAME_MODEL_EVENT_TYPE_VIEW_CHANGED, gameModelEventsNotifyListeners } from '../../game-model/events';
import { AbstractGameBoardViewAdapter } from '../AbstractGameBoardViewAdapter';
import type { IGameBoardViewAdapter } from '../IGameBoardViewAdapter';

export class GchessboardBoardViewAdapter extends AbstractGameBoardViewAdapter implements IGameBoardViewAdapter {
  readonly rep: GChessBoardElement;
  readonly gameModelResources: GameModelResources;

  constructor(gameModelResources: GameModelResources, boardEl: HTMLElement) {
    super();
    this.rep = document.createElement('g-chess-board') as GChessBoardElement;
    this.gameModelResources = gameModelResources;

    this.rep.coordinates = 'outside';
    this.rep.turn = 'white';
    this.rep.interactive = true;
    this.rep.fen = START_FEN;

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
      this.rep.shadowRoot?.appendChild(style);
    });

    this.rep.addEventListener('moveend', (e) => {
      if (!this.gameModelResources.isLegalMove([e.detail.from, e.detail.to])) {
        e.preventDefault();
      }
      // console.log('KONK91', tick, `${e.detail.from} to ${e.detail.to}`);
      // tick(`${e.detail.from} to ${e.detail.to}`);
      /*
      const move = this.gameModelResources.chess.move({
        from: e.detail.from,
        to: e.detail.to,
      });
      if (move === null) {
        e.preventDefault();
      }
      moveHighlight(rep, e.detail.from, e.detail.to);
       */
    });

    this.rep.addEventListener('movefinished', (e) => {
      gameModelEventsNotifyListeners(this.gameModelResources, GAME_MODEL_EVENT_TYPE_VIEW_CHANGED, {
        type: GAME_MODEL_EVENT_TYPE_VIEW_CHANGED,
        move: [e.detail.from, e.detail.to],
      });
      moveHighlight(rep, e.detail.from, e.detail.to);
      this.rep.turn = this.gameModelResources.chess.turn() === 'w' ? 'white' : 'black';

      /*
      tick(`${e.detail.from} to ${e.detail.to}`);
      // this.rep.fen = this.gameModelResources.chess.fen();
      this.rep.turn = this.gameModelResources.chess.turn() === 'w' ? 'white' : 'black';

      console.log('Ra: ', this.gameModelResources.chess.ascii());
      console.log('Rp: ', this.gameModelResources.chess.pgn());
      console.log('Rf: ', this.gameModelResources.chess.fen());
       */
    });

    boardEl.replaceChildren(this.rep);
  }

  move(coords: [Square, Square], fen: string): void {
    this.rep.fen = fen;
    this.moveHighlight(coords);
  }

  toggleOrientation(): void {
    this.rep.orientation = this.rep.orientation === 'white' ? 'black' : 'white';
  }

  moveHighlight(coords: [Square, Square]): void {
    const [from, to] = coords;

    // Remove the attribute from any square that currently has it
    this.rep.shadowRoot?.querySelectorAll('[last-move]')?.forEach((sq) => sq.removeAttribute('last-move'));

    // Find the new squares and add the attribute
    const fromSq = this.rep.shadowRoot?.querySelector(`[data-square="${from}"]`);
    const toSq = this.rep.shadowRoot?.querySelector(`[data-square="${to}"]`);

    if (fromSq) fromSq.setAttribute('last-move', '');
    if (toSq) toSq.setAttribute('last-move', '');
  }
}
