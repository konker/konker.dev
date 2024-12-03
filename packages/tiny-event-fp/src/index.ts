/* eslint-disable fp/no-unused-expression */
import * as P from '@konker.dev/effect-ts-prelude';

export type TinyEventListener<T, X> = (eventType: T, eventData?: X) => P.Effect.Effect<void, Error>;

export type TinyEventDispatcher<T, X> = {
  readonly listeners: Map<T, Set<TinyEventListener<T, X>>>;
  readonly starListeners: Set<TinyEventListener<T, X>>;
};

export function createTinyEventDispatcher<T, A>(): P.Effect.Effect<TinyEventDispatcher<T, A>, Error> {
  const listeners = new Map<T, Set<TinyEventListener<T, A>>>();
  const starListeners = new Set<TinyEventListener<T, A>>();

  return P.Effect.succeed({ listeners, starListeners });
}

export const addListener =
  <T, A>(eventType: T, listener: TinyEventListener<T, A>) =>
  (dispatcher: TinyEventDispatcher<T, A>): P.Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    if (!dispatcher.listeners.has(eventType)) {
      dispatcher.listeners.set(eventType, new Set<TinyEventListener<T, A>>());
    }
    dispatcher.listeners.get(eventType)!.add(listener);
    return P.Effect.succeed(dispatcher);
  };

export const addStarListener =
  <T, A>(listener: TinyEventListener<T, A>) =>
  (dispatcher: TinyEventDispatcher<T, A>): P.Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    dispatcher.starListeners.add(listener);
    return P.Effect.succeed(dispatcher);
  };

export const removeListener =
  <T, A>(eventType: T, listener: TinyEventListener<T, A>) =>
  (dispatcher: TinyEventDispatcher<T, A>): P.Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    if (dispatcher.listeners.has(eventType)) {
      dispatcher.listeners.get(eventType)!.delete(listener);
    }
    return P.Effect.succeed(dispatcher);
  };

export const removeStarListener =
  <T, A>(listener: TinyEventListener<T, A>) =>
  (dispatcher: TinyEventDispatcher<T, A>): P.Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    if (dispatcher.starListeners.has(listener)) {
      dispatcher.starListeners.delete(listener);
    }
    return P.Effect.succeed(dispatcher);
  };

export const removeAllListeners =
  <T, A>() =>
  (_dispatcher: TinyEventDispatcher<T, A>): P.Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    return P.Effect.succeed({
      listeners: new Map<T, Set<TinyEventListener<T, A>>>(),
      starListeners: new Set<TinyEventListener<T, A>>(),
    });
  };

export const notify =
  <T, A>(eventType: T, eventData?: A) =>
  (dispatcher: TinyEventDispatcher<T, A>): P.Effect.Effect<TinyEventDispatcher<T, A>, Error> => {
    const listenerValues = dispatcher.listeners.get(eventType)?.values() ?? [];
    const starListenerValues = dispatcher.starListeners.values();

    return P.pipe(
      [...listenerValues, ...starListenerValues].map((f) => f(eventType, eventData)),
      P.Effect.all,
      P.Effect.map((_) => dispatcher)
    );
  };
