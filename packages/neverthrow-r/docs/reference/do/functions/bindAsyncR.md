[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [do](../README.md) / bindAsyncR

# Function: bindAsyncR()

> **bindAsyncR**\<`N`, `S`, `R2`, `A`, `E2`\>(`name`, `f`): \<`R1`, `E1`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

Defined in: [do.ts:32](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/do.ts#L32)

## Type Parameters

### N

`N` *extends* `string`

### S

`S` *extends* `object`

### R2

`R2`

### A

`A`

### E2

`E2`

## Parameters

### name

`N`

### f

(`s`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `A`, `E2`\>

## Returns

> \<`R1`, `E1`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

### Type Parameters

#### R1

`R1`

#### E1

`E1`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1`, `S`, `E1`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>
