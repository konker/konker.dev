---
title: 'createTinyEventDispatcher()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# createTinyEventDispatcher()

```ts
function createTinyEventDispatcher<T, A>(): P.Effect.Effect<TinyEventDispatcher<T, A>, never>;
```

Create an empty `TinyEventDispatcher` value.

## Type parameters

• **T**

The possible event types that can be received

• **A**

The type of the event data which can be received

## Returns

`P.Effect.Effect`\<[`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>, `never`\>

- A new `TinyEventDispatcher` value wrapped in a `Effect`

## Source

[index.ts:41](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L41)
