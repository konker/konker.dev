---
title: 'setFact()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# setFact()

```ts
function setFact<F>(key, value): (facts) => F;
```

## Type parameters

• **F** _extends_ [`Facts`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/facts)

## Parameters

• **key**: keyof `F`

• **value**: `boolean`

## Returns

`Function`

### Parameters

• **facts**: `F`

### Returns

`F`

## Source

[index.ts:34](https://github.com/konkerdotdev/tiny-rules-fp/blob/fcc48fe23550c06b9079db840fa9b2e3d8cffc09/src/index.ts#L34)
