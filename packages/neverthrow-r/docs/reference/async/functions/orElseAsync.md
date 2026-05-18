[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [async](../README.md) / orElseAsync

# Function: orElseAsync()

> **orElseAsync**\<`E`, `R2`, `U`, `F`\>(`f`): \<`R1`, `T`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `U` \| `T`, `F`\>

Defined in: [async.ts:32](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L32)

## Type Parameters

### E

`E`

### R2

`R2`

### U

`U`

### F

`F`

## Parameters

### f

(`e`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `U`, `F`\>

## Returns

> \<`R1`, `T`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `U` \| `T`, `F`\>

### Type Parameters

#### R1

`R1`

#### T

`T`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1`, `T`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `U` \| `T`, `F`\>
