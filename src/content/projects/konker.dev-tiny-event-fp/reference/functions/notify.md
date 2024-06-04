---
title: 'Function: notify()'
author: 'Konrad Markus'
description: FIXME-DESC
type: reference
---
# Function: notify()

```ts
function notify<T, A>(eventType, eventData?): (dispatcher) => Effect<TinyEventDispatcher<T, A>, Error, never>
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

• **dispatcher**: [`TinyEventDispatcher`](../type-aliases/TinyEventDispatcher.md)\<`T`, `A`\>

### Returns

`Effect`\<[`TinyEventDispatcher`](../type-aliases/TinyEventDispatcher.md)\<`T`, `A`\>, `Error`, `never`\>

## Source

[index.ts:63](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L63)
