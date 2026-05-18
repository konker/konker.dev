[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [async](../README.md) / mapErrAsync

# Function: mapErrAsync()

> **mapErrAsync**\<`E`, `F`\>(`f`): \<`R`, `T`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `F`\>

Defined in: [async.ts:20](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L20)

## Type Parameters

### E

`E`

### F

`F`

## Parameters

### f

(`e`) => `F` \| `Promise`\<`F`\>

## Returns

> \<`R`, `T`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `F`\>

### Type Parameters

#### R

`R`

#### T

`T`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `F`\>
