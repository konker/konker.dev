---
title: 'addListener()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# addListener()

```ts
function addListener<T, A>(eventType, listener): (dispatcher) => Effect<TinyEventDispatcher<T, A>, never, never>;
```

Add the given listener for the given event to the given `TinyEventDispatcher`.

Adding a given listener function reference is an idempotent operation.
That is to say, irrespective of how many times a given listener is added for a given event,
it will only be triggered once.

**Note:** the same listener function reference _can_ be added for multiple different events.

## Type parameters

• **T**

The possible event types that can be received

• **A**

The type of the event data which can be received

## Parameters

• **eventType**: `T`

The event to listen for

• **listener**: [`TinyEventListener`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventlistener)\<`T`, `A`\>

The listener function

## Returns

`Function`

- A function to add the given listener for the given event to a `TinyEventDispatcher` value

### Parameters

• **dispatcher**: [`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>

The `TinyEventDispatcher` to add the listener to

### Returns

`Effect`\<[`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>, `never`, `never`\>

## Source

[index.ts:64](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L64)
