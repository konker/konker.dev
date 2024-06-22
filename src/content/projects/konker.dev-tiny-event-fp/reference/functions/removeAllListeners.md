---
title: 'removeAllListeners()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# removeAllListeners()

```ts
function removeAllListeners<T, A>(): (_dispatcher) => Effect<TinyEventDispatcher<T, A>, never, never>;
```

Remove all listeners from the given `TinyEventDispatcher`.

## Type parameters

• **T**

The possible event types that can be received

• **A**

The type of the event data which can be received

## Returns

`Function`

- A function to remove all listeners from a `TinyEventDispatcher` value

### Parameters

• **\_dispatcher**: [`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>

### Returns

`Effect`\<[`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>, `never`, `never`\>

## Source

[index.ts:156](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L156)
