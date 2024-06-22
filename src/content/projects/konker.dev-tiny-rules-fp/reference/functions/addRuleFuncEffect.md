---
title: 'addRuleFuncEffect()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# addRuleFuncEffect()

```ts
function addRuleFuncEffect<R, C, E, F>(factName, ruleFuncEffect, _note): RuleSetTransform<R, C, E, F>;
```

## Type parameters

• **R**

• **C**

• **E**

• **F** _extends_ [`Facts`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/facts)

## Parameters

• **factName**: keyof `F`

• **ruleFuncEffect**: [`RuleFuncEffect`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/rulefunceffect)\<`R`, `C`, `E`, `F`\>

• **\_note**: `string`= `''`

## Returns

[`RuleSetTransform`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/rulesettransform)\<`R`, `C`, `E`, `F`\>

## Source

[index.ts:59](https://github.com/konkerdotdev/tiny-rules-fp/blob/fcc48fe23550c06b9079db840fa9b2e3d8cffc09/src/index.ts#L59)
