[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [async](../README.md) / mapAsync

# Function: mapAsync()

> **mapAsync**\<`A`, `B`\>(`f`): \<`R`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

Defined in: [async.ts:14](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L14)

## Type Parameters

### A

`A`

### B

`B`

## Parameters

### f

(`a`) => `B` \| `Promise`\<`B`\>

## Returns

> \<`R`, `E`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

### Type Parameters

#### R

`R`

#### E

`E`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `A`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>
