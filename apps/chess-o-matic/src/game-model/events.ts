import type { Square } from 'chess.js';

import type {
  GameModelEvaluateResult,
  GameModelEvaluateResultControl,
  GameModelEvaluateResultIgnore,
  GameModelEvaluateResultIllegal,
  GameModelEvaluateResultOk,
} from './evaluate.js';
import type { GameModelResources } from './index.js';

// --------------------------------------------------------------------------
export const GAME_MODEL_EVENT_TYPE_START = 'start' as const;
export const GAME_MODEL_EVENT_TYPE_EVALUATED = 'evaluated' as const;
export const GAME_MODEL_EVENT_TYPE_MOVED_OK = 'moved-ok' as const;
export const GAME_MODEL_EVENT_TYPE_MOVED_INVALID = 'moved-invalid' as const;
export const GAME_MODEL_EVENT_TYPE_CONTROL = 'control' as const;
export const GAME_MODEL_EVENT_TYPE_VIEW_CHANGED = 'view-changed' as const;
export const GAME_MODEL_EVENT_TYPE_END = 'end' as const;

export type GameModelEventType =
  | typeof GAME_MODEL_EVENT_TYPE_START
  | typeof GAME_MODEL_EVENT_TYPE_EVALUATED
  | typeof GAME_MODEL_EVENT_TYPE_MOVED_OK
  | typeof GAME_MODEL_EVENT_TYPE_MOVED_INVALID
  | typeof GAME_MODEL_EVENT_TYPE_CONTROL
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

export type GameModelEventMovedOk = {
  type: typeof GAME_MODEL_EVENT_TYPE_MOVED_OK;
  result: GameModelEvaluateResultOk;
};

export type GameModelEventMovedInvalid = {
  type: typeof GAME_MODEL_EVENT_TYPE_MOVED_INVALID;
  result: GameModelEvaluateResultIgnore | GameModelEvaluateResultIllegal;
};

export type GameModelEventControl = {
  type: typeof GAME_MODEL_EVENT_TYPE_CONTROL;
  result: GameModelEvaluateResultControl;
};

export type GameModelEventViewChanged = {
  type: typeof GAME_MODEL_EVENT_TYPE_VIEW_CHANGED;
  move: [Square, Square] | string; // Coords or SAN
};

export type GameModelEventEnd = {
  type: typeof GAME_MODEL_EVENT_TYPE_END;
  fen: string;
};

export type GameModelEvent =
  | GameModelEventStart
  | GameModelEventEvaluated
  | GameModelEventMovedOk
  | GameModelEventMovedInvalid
  | GameModelEventControl
  | GameModelEventViewChanged
  | GameModelEventEnd;

// --------------------------------------------------------------------------
export type GameModelEventListener<E extends GameModelEvent> = (event: E) => Promise<void>;

export function gameModelEventsEmptyListeners(): Map<GameModelEventType, Set<GameModelEventListener<GameModelEvent>>> {
  return new Map([
    [GAME_MODEL_EVENT_TYPE_START, new Set()],
    [GAME_MODEL_EVENT_TYPE_EVALUATED, new Set()],
    [GAME_MODEL_EVENT_TYPE_MOVED_OK, new Set()],
    [GAME_MODEL_EVENT_TYPE_MOVED_INVALID, new Set()],
    [GAME_MODEL_EVENT_TYPE_CONTROL, new Set()],
    [GAME_MODEL_EVENT_TYPE_VIEW_CHANGED, new Set()],
    [GAME_MODEL_EVENT_TYPE_END, new Set()],
  ]);
}

export function gameModelEventsAddListener<E extends GameModelEvent>(
  gameModelResources: GameModelResources,
  type: E['type'],
  eventListener: GameModelEventListener<E>
): GameModelResources {
  const currentListeners = gameModelResources.listeners.get(type) ?? new Set<GameModelEventListener<GameModelEvent>>();
  return {
    ...gameModelResources,
    listeners: gameModelResources.listeners.set(
      type,
      new Set([...currentListeners, eventListener as GameModelEventListener<GameModelEvent>])
    ),
  };
}

export async function gameModelEventsNotifyListeners<E extends GameModelEvent>(
  gameModelResources: GameModelResources,
  type: E['type'],
  event: E
): Promise<void> {
  const listeners = gameModelResources.listeners.get(event.type) ?? [];

  await Promise.all([...listeners].map((listener) => listener(event)));
}
