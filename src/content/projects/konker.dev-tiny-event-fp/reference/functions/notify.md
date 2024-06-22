---
title: 'notify()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# notify()

```ts
function notify<T, A>(eventType, eventData?): (dispatcher) => Effect<TinyEventDispatcher<T, A>, Error, never>;
```

## Type parameters

• **T**

• **A**

## Parameters

• **eventType**: `T`

• **eventData?**: `A`

## Returns

`Function`

### Parameters

• **dispatcher**: [`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>

### Returns

`Effect`\<[`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>, `Error`, `never`\>

## Source

[index.ts:63](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L63)
