[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [bridges](../README.md) / asyncAndThrough

# Function: asyncAndThrough()

> **asyncAndThrough**\<`T`, `R2`, `F`\>(`f`): \<`R1`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>

Defined in: [bridges.ts:25](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/bridges.ts#L25)

## Type Parameters

### T

`T`

### R2

`R2`

### F

`F`

## Parameters

### f

(`t`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `unknown`, `F`\>

## Returns

> \<`R1`, `E`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>

### Type Parameters

#### R1

`R1`

#### E

`E`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1`, `T`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>
