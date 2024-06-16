---
title: 'sequence()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# sequence()

```ts
function sequence<R, C, E, F>(rulesList): (ruleSet) => RuleSet<R, C, E, F>;
```

## Type parameters

• **R**

• **C**

• **E**

• **F** _extends_ [`Facts`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/facts)

## Parameters

• **rulesList**: readonly [`RuleSetTransform`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/rulesettransform)\<`R`, `C`, `E`, `F`\>[]

## Returns

`Function`

### Parameters

• **ruleSet**: [`RuleSet`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/ruleset)\<`R`, `C`, `E`, `F`\>

### Returns

[`RuleSet`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/ruleset)\<`R`, `C`, `E`, `F`\>

## Source

[index.ts:74](https://github.com/konkerdotdev/tiny-rules-fp/blob/fcc48fe23550c06b9079db840fa9b2e3d8cffc09/src/index.ts#L74)
