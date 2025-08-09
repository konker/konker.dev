/* eslint-disable fp/no-unused-expression */
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
export type TinyEventListener<T, X> = (eventType: T, eventData?: X) => Effect.Effect<void, Error>;

export type TinyEventDispatcher<T, X> = {
  readonly listeners: Map<T, Set<TinyEventListener<T, X>>>;
  readonly starListeners: Set<TinyEventListener<T, X>>;
};

export function createTinyEventDispatcher<T, A>(): Effect.Effect<TinyEventDispatcher<T, A>, Error> {
  const listeners = new Map<T, Set<TinyEventListener<T, A>>>();
  const starListeners = new Set<TinyEventListener<T, A>>();

  return Effect.succeed({ listeners, starListeners });
}

export const addListener =
  <T, A>(eventType: NoInfer<T>, listener: TinyEventListener<T, A>) =>
  (dispatcher: TinyEventDispatcher<T, A>): Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    if (!dispatcher.listeners.has(eventType)) {
      dispatcher.listeners.set(eventType, new Set<TinyEventListener<T, A>>());
    }
    dispatcher.listeners.get(eventType)!.add(listener);
    return Effect.succeed(dispatcher);
  };

export const addStarListener =
  <T, A>(listener: TinyEventListener<T, A>) =>
  (dispatcher: TinyEventDispatcher<T, A>): Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    dispatcher.starListeners.add(listener);
    return Effect.succeed(dispatcher);
  };

export const removeListener =
  <T, A>(eventType: NoInfer<T>, listener: TinyEventListener<T, A>) =>
  (dispatcher: TinyEventDispatcher<T, A>): Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    if (dispatcher.listeners.has(eventType)) {
      dispatcher.listeners.get(eventType)!.delete(listener);
    }
    return Effect.succeed(dispatcher);
  };

export const removeStarListener =
  <T, A>(listener: TinyEventListener<T, A>) =>
  (dispatcher: TinyEventDispatcher<T, A>): Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    if (dispatcher.starListeners.has(listener)) {
      dispatcher.starListeners.delete(listener);
    }
    return Effect.succeed(dispatcher);
  };

export const removeAllListeners =
  <T, A>() =>
  (_dispatcher: TinyEventDispatcher<T, A>): Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    return Effect.succeed({
      listeners: new Map<T, Set<TinyEventListener<T, A>>>(),
      starListeners: new Set<TinyEventListener<T, A>>(),
    });
  };

export const notify =
  <T, A>(eventType: NoInfer<T>, eventData?: A) =>
  (dispatcher: TinyEventDispatcher<T, A>): Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    const listenerValues = dispatcher.listeners.get(eventType)?.values() ?? [];
    const starListenerValues = dispatcher.starListeners.values();

    return pipe(
      [...listenerValues, ...starListenerValues].map((f) => f(eventType, eventData)),
      Effect.all,
      Effect.map((_) => dispatcher)
    );
  };
