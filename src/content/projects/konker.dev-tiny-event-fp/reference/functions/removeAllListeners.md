---
title: 'Function: removeAllListeners()'
author: 'Konrad Markus'
description: FIXME-DESC
type: reference
---
# Function: removeAllListeners()

```ts
function removeAllListeners<T, A>(): (_dispatcher) => Effect<TinyEventDispatcher<T, A>, Error, never>
```

## Type parameters

• **T**

• **A**

## Returns

`Function`

### Parameters

• **\_dispatcher**: [`TinyEventDispatcher`](../type-aliases/TinyEventDispatcher.md)\<`T`, `A`\>

### Returns

`Effect`\<[`TinyEventDispatcher`](../type-aliases/TinyEventDispatcher.md)\<`T`, `A`\>, `Error`, `never`\>

## Source

[index.ts:54](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L54)
