[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [async](../README.md) / matchAsync

# Function: matchAsync()

> **matchAsync**\<`T`, `E`, `A`, `B`\>(`okFn`, `errFn`): \<`R`\>(`rr`) => (`r`) => `Promise`\<`A` \| `B`\>

Defined in: [async.ts:38](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L38)

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

> \<`R`\>(`rr`): (`r`) => `Promise`\<`A` \| `B`\>

### Type Parameters

#### R

`R`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

### Returns

> (`r`): `Promise`\<`A` \| `B`\>

#### Parameters

##### r

`R`

#### Returns

`Promise`\<`A` \| `B`\>
