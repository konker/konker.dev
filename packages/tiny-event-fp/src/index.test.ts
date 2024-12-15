import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import * as unit from './index.js';

describe('TinyEvent', () => {
  const EventTypeFoo = 'Foo';
  const EventTypeBar = 'Bar';
  const EventTypeBaz = 'Baz';
  type EventType = typeof EventTypeFoo | typeof EventTypeBar | typeof EventTypeBaz;

  it('should work as expected', async () => {
    const lFoo1 = vi.fn((_t: EventType, _d?: string) => Effect.void);
    const lFoo2 = vi.fn((_t: EventType, _d?: string) => Effect.void);
    const l2 = vi.fn((_t: EventType, _d?: string) => Effect.void);
    const l3 = vi.fn((_t: EventType, _d?: string) => Effect.void);

    const prog = pipe(
      unit.createTinyEventDispatcher<EventType, string>(),
      Effect.flatMap(unit.removeListener<EventType, string>(EventTypeFoo, lFoo1)),
      Effect.flatMap(unit.addListener<EventType, string>(EventTypeFoo, lFoo1)),
      Effect.flatMap(unit.addListener<EventType, string>(EventTypeFoo, lFoo2)),
      Effect.flatMap(unit.addListener<EventType, string>(EventTypeBar, l2)),
      Effect.flatMap(unit.addStarListener<EventType, string>(l3)),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeFoo, 'Hello Foo 1')),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeBar, 'Hello Bar 1')),
      Effect.flatMap(unit.removeListener<EventType, string>(EventTypeFoo, lFoo1)),
      Effect.flatMap(unit.removeListener<EventType, string>(EventTypeFoo, lFoo2)),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeFoo, 'Hello Foo 2')),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeBar, 'Hello Bar 2')),
      Effect.flatMap(unit.removeStarListener<EventType, string>(l3)),
      Effect.flatMap(unit.removeStarListener<EventType, string>(l3)),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeFoo, 'Hello Foo 3')),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeBar, 'Hello Bar 3')),
      Effect.flatMap(unit.removeAllListeners<EventType, string>()),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeFoo, 'Hello Foo 4')),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeBar, 'Hello Bar 4')),
      Effect.flatMap(unit.notify<EventType, string>(EventTypeBaz, 'Hello Baz 1'))
    );

    const result = await Effect.runPromise(prog);
    expect(result).toHaveProperty('listeners');
    expect(lFoo1).toHaveBeenCalledTimes(1);
    expect(lFoo1.mock.calls[0]).toEqual([EventTypeFoo, 'Hello Foo 1']);
    expect(l2).toHaveBeenCalledTimes(3);
    expect(l2.mock.calls[0]).toEqual([EventTypeBar, 'Hello Bar 1']);
    expect(l2.mock.calls[1]).toEqual([EventTypeBar, 'Hello Bar 2']);
    expect(l2.mock.calls[2]).toEqual([EventTypeBar, 'Hello Bar 3']);
    expect(l3).toHaveBeenCalledTimes(4);
    expect(l3.mock.calls[0]).toEqual([EventTypeFoo, 'Hello Foo 1']);
    expect(l3.mock.calls[1]).toEqual([EventTypeBar, 'Hello Bar 1']);
    expect(l3.mock.calls[2]).toEqual([EventTypeFoo, 'Hello Foo 2']);
    expect(l3.mock.calls[3]).toEqual([EventTypeBar, 'Hello Bar 2']);
  });
});
