[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [async](../README.md) / andThenAsync

# Function: andThenAsync()

> **andThenAsync**\<`A`, `R2`, `B`, `E2`\>(`f`): \<`R1`, `E1`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

Defined in: [async.ts:26](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L26)

## Type Parameters

### A

`A`

### R2

`R2`

### B

`B`

### E2

`E2`

## Parameters

### f

(`a`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `B`, `E2`\>

## Returns

> \<`R1`, `E1`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

### Type Parameters

#### R1

`R1`

#### E1

`E1`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1`, `A`, `E1`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>
