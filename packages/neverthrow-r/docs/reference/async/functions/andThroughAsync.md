[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [async](../README.md) / andThroughAsync

# Function: andThroughAsync()

> **andThroughAsync**\<`T`, `R2`, `F`\>(`f`): \<`R1`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>

Defined in: [async.ts:56](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L56)

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

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1`, `T`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>
