/* eslint-disable fp/no-this,fp/no-loops */
import type { Square } from 'chess.js';

import type { IGameBoardViewAdapter, OnMoveEventListener } from './IGameBoardViewAdapter';

export abstract class AbstractGameBoardViewAdapter implements IGameBoardViewAdapter {
  private _onMoveEventListeners: Array<OnMoveEventListener> = [];

  abstract move(coords: [Square, Square], fen: string): void;
  abstract toggleOrientation(): void;

  addOnMoveEventListener(listener: OnMoveEventListener): void {
    this._onMoveEventListeners.push(listener);
  }

  removeAllOnMoveEventListeners(): void {
    this._onMoveEventListeners = [];
  }

  notifyOnMove(orig: Square, dest: Square): void {
    for (const listener of this._onMoveEventListeners) {
      listener(orig, dest);
    }
  }
}
