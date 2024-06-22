---
title: 'TinyEventDispatcher'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 5
kind: reference
---

# TinyEventDispatcher

```ts
type TinyEventDispatcher<T, A>: object;
```

A record value which holds the listeners that will react to events.

A given listener function reference can only appear once for any given event.
Likewise, a given wildcard listener function reference will only be triggered once.

## Type parameters

• **T**

The possible event types that can be received

• **A**

The type of the event data which can be received

## Type declaration

### listeners

```ts
readonly listeners: Map<T, Set<TinyEventListener<T, A>>>;
```

Holds a set of listeners for each possible event type

### starListeners

```ts
readonly starListeners: Set<TinyEventListener<T, A>>;
```

Holds a set of wildcard listeners which will be invoked for all events

## Source

[index.ts:22](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L22)
