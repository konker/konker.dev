---
title: 'Type alias: TinyEventListener()\<T, X\>'
author: 'Konrad Markus'
description: FIXME-DESC
type: reference
---
# Type alias: TinyEventListener()\<T, X\>

```ts
type TinyEventListener<T, X>: (eventType, eventData?) => P.Effect.Effect<void, Error>;
```

## Type parameters

• **T**

• **X**

## Parameters

• **eventType**: `T`

• **eventData?**: `X`

## Returns

`P.Effect.Effect`\<`void`, `Error`\>

## Source

[index.ts:4](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L4)
