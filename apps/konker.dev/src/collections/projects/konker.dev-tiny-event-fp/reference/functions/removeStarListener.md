---
title: 'removeStarListener()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# removeStarListener()

```ts
function removeStarListener<T, A>(listener): (dispatcher) => Effect<TinyEventDispatcher<T, A>, never, never>;
```

Remove the given wildcard listener from the given `TinyEventDispatcher`.

The listener value must be the same reference that was previously added

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

- A function to remove the given listener from a `TinyEventDispatcher` value

### Parameters

• **dispatcher**: [`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>

The `TinyEventDispatcher` to remove the listener from

### Returns

`Effect`\<[`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>, `never`, `never`\>

## Source

[index.ts:136](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L136)
