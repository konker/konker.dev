---
title: 'RuleFuncEffect()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 2
kind: reference
---

# RuleFuncEffect()

```ts
type RuleFuncEffect<R, C, E, F>: (context, facts) => P.Effect.Effect<boolean, E, R>;
```

## Type parameters

• **R**

• **C**

• **E**

• **F** _extends_ [`Facts`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/facts)

## Parameters

• **context**: `C`

• **facts**: `F`

## Returns

`P.Effect.Effect`\<`boolean`, `E`, `R`\>

## Source

[index.ts:19](https://github.com/konkerdotdev/tiny-rules-fp/blob/fcc48fe23550c06b9079db840fa9b2e3d8cffc09/src/index.ts#L19)
