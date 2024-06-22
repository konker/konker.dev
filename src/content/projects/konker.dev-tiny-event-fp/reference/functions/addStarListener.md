---
title: 'addStarListener()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# addStarListener()

```ts
function addStarListener<T, A>(listener): (dispatcher) => Effect<TinyEventDispatcher<T, A>, never, never>;
```

Add a wildcard listener for all possible events to the given `TinyEventDispatcher`.

Adding a given wildcard listener function reference is an idempotent operation.
That is to say, irrespective of how many times a given wildcard listener is added
it will only be triggered once.

## Type parameters

• **T**

The possible event types that can be received

• **A**

The type of the event data which can be received

## Parameters

• **listener**: [`TinyEventListener`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventlistener)\<`T`, `A`\>

The listener function

## Returns

`Function`

- A function to add the given listener to a `TinyEventDispatcher` value

### Parameters

• **dispatcher**: [`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>

The `TinyEventDispatcher` to add the listener to

### Returns

`Effect`\<[`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>, `never`, `never`\>

## Source

[index.ts:90](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L90)
