[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [sync](../README.md) / match

# Function: match()

> **match**\<`T`, `E`, `A`, `B`\>(`okFn`, `errFn`): \<`R`\>(`rr`) => (`r`) => `A` \| `B`

Defined in: [sync.ts:37](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L37)

## Type Parameters

### T

`T`

### E

`E`

### A

`A`

### B

`B` = `A`

## Parameters

### okFn

(`t`) => `A`

### errFn

(`e`) => `B`

## Returns

> \<`R`\>(`rr`): (`r`) => `A` \| `B`

### Type Parameters

#### R

`R`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

### Returns

> (`r`): `A` \| `B`

#### Parameters

##### r

`R`

#### Returns

`A` \| `B`
