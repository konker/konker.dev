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

Notify all relevant listeners of the given event with the given event data.

## Type parameters

• **T**

The possible event types that can be received

• **A**

The type of the event data which can be received

## Parameters

• **eventType**: `T`

The type of event being triggered

• **eventData?**: `A`

The event data to send to all relevant listeners

## Returns

`Function`

- A function to notify all relevant listeners in a `TinyEventDispatcher` value

### Parameters

• **dispatcher**: [`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>

The `TinyEventDispatcher` to notify relevant listeners from

### Returns

`Effect`\<[`TinyEventDispatcher`](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher)\<`T`, `A`\>, `Error`, `never`\>

## Source

[index.ts:178](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L178)
