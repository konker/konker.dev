---
title: 'TinyEventListener()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 5
kind: reference
---

# TinyEventListener()

```ts
type TinyEventListener<T, A>: (eventType, eventData?) => P.Effect.Effect<void, Error>;
```

Signature of an event listener function.

## Type parameters

• **T**

The possible event types that can be received

• **A**

The type of the event data which can be received

## Parameters

• **eventType**: `T`

• **eventData?**: `A`

## Returns

`P.Effect.Effect`\<`void`, `Error`\>

## Source

[index.ts:11](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L11)
