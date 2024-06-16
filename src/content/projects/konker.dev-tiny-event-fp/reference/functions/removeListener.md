---
title: 'removeListener()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# removeListener()

```ts
function removeListener<T, A>(eventType, listener): (dispatcher) => Effect<TinyEventDispatcher<T, A>, Error, never>;
```

## Type parameters

• **T**

• **A**

## Parameters

• **eventType**: `T`

• **listener**: [`TinyEventListener`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventlistener)\<`T`, `A`\>

## Returns

`Function`

### Parameters

• **dispatcher**: [`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>

### Returns

`Effect`\<[`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>, `Error`, `never`\>

## Source

[index.ts:36](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L36)
