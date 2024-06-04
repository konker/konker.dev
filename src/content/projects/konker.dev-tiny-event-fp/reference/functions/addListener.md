---
title: 'Function: addListener()'
author: 'Konrad Markus'
description: FIXME-DESC
type: reference
---
# Function: addListener()

```ts
function addListener<T, A>(eventType, listener): (dispatcher) => Effect<TinyEventDispatcher<T, A>, Error, never>
```

## Type parameters

• **T**

• **A**

## Parameters

• **eventType**: `T`

• **listener**: [`TinyEventListener`](../type-aliases/TinyEventListener.md)\<`T`, `A`\>

## Returns

`Function`

### Parameters

• **dispatcher**: [`TinyEventDispatcher`](../type-aliases/TinyEventDispatcher.md)\<`T`, `A`\>

### Returns

`Effect`\<[`TinyEventDispatcher`](../type-aliases/TinyEventDispatcher.md)\<`T`, `A`\>, `Error`, `never`\>

## Source

[index.ts:19](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L19)
