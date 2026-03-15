import type { Square } from 'chess.js';

import type { GameViewResources } from '../game-view';
import type { GameModelEvaluateResult } from './evaluate';
import type { GameModelResources } from './index';

// --------------------------------------------------------------------------
export const GAME_MODEL_EVENT_TYPE_START = 'start' as const;
export const GAME_MODEL_EVENT_TYPE_EVALUATED = 'evaluated-result' as const;
export const GAME_MODEL_EVENT_TYPE_VIEW_CHANGED = 'view-changed' as const;
export const GAME_MODEL_EVENT_TYPE_END = 'end' as const;

export type GameModelEventType =
  | typeof GAME_MODEL_EVENT_TYPE_START
  | typeof GAME_MODEL_EVENT_TYPE_EVALUATED
  | typeof GAME_MODEL_EVENT_TYPE_VIEW_CHANGED
  | typeof GAME_MODEL_EVENT_TYPE_END;

export type GameModelEventStart = {
  type: typeof GAME_MODEL_EVENT_TYPE_START;
  fen: string;
};

export type GameModelEventEvaluated = {
  type: typeof GAME_MODEL_EVENT_TYPE_EVALUATED;
  result: GameModelEvaluateResult;
};

export type GameModelEventViewChanged = {
  type: typeof GAME_MODEL_EVENT_TYPE_VIEW_CHANGED;
  move: [Square, Square];
};

export type GameModelEventEnd = {
  type: typeof GAME_MODEL_EVENT_TYPE_END;
  fen: string;
};

export type GameModelEvent =
  | GameModelEventStart
  | GameModelEventEvaluated
  | GameModelEventViewChanged
  | GameModelEventEnd;

// --------------------------------------------------------------------------
export type GameModelEventListener<E extends GameModelEvent> = (event: E) => void;

export function gameModelEventsEmptyListeners(): Map<GameModelEventType, Set<GameModelEventListener<GameModelEvent>>> {
  return new Map([
    [GAME_MODEL_EVENT_TYPE_START, new Set()],
    [GAME_MODEL_EVENT_TYPE_EVALUATED, new Set()],
    [GAME_MODEL_EVENT_TYPE_VIEW_CHANGED, new Set()],
    [GAME_MODEL_EVENT_TYPE_END, new Set()],
  ]);
}

export function gameModelEventsAddListener<E extends GameModelEvent>(
  gameModelResources: GameModelResources,
  type: E['type'],
  eventListener: GameModelEventListener<E>
): GameModelResources {
  const currentListeners = gameModelResources.listeners.get(type) ?? new Set<GameModelEventListener<E>>();
  return {
    ...gameModelResources,
    listeners: gameModelResources.listeners.set(
      type,
      new Set<GameModelEventListener<E>>([...currentListeners, eventListener])
    ),
  };
}

export function gameModelEventsNotifyListeners<E extends GameModelEvent>(
  gameModelResources: GameModelResources,
  type: E['type'],
  event: E
): void {
  gameModelResources.listeners.get(event.type)?.forEach((listener) => {
    console.log('KONK80', listener, event);
    listener(event);
  });
}
