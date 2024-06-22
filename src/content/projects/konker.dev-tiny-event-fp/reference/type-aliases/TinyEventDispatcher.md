---
title: 'TinyEventDispatcher'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 5
kind: reference
---

# TinyEventDispatcher

```ts
type TinyEventDispatcher<T, X>: object;
```

## Type parameters

• **T**

• **X**

## Type declaration

### listeners

```ts
readonly listeners: Map<T, Set<TinyEventListener<T, X>>>;
```

### starListeners

```ts
readonly starListeners: Set<TinyEventListener<T, X>>;
```

## Source

[index.ts:6](https://github.com/konkerdotdev/tiny-event-fp/blob/35c286bc511870798a7f3d70c0cc704e7c0c0006/src/index.ts#L6)
