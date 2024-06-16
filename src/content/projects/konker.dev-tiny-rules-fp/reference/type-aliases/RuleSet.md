---
title: 'RuleSet'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 2
kind: reference
---

# RuleSet

```ts
type RuleSet<R, C, E, F>: object;
```

## Type parameters

• **R**

• **C**

• **E**

• **F** _extends_ [`Facts`](/projects/konkerdev-tiny-rules-fp/reference/type-aliases/facts)

## Type declaration

### facts

```ts
readonly facts: F;
```

### rules

```ts
readonly rules: Rule<R, C, E, F>[];
```

## Source

[index.ts:10](https://github.com/konkerdotdev/tiny-rules-fp/blob/fcc48fe23550c06b9079db840fa9b2e3d8cffc09/src/index.ts#L10)
