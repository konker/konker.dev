[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [do](../README.md) / bindR

# Function: bindR()

> **bindR**\<`N`, `S`, `R2`, `A`, `E2`\>(`name`, `f`): \<`R1`, `E1`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

Defined in: [do.ts:26](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/do.ts#L26)

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

(`s`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R2`, `A`, `E2`\>

## Returns

> \<`R1`, `E1`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

### Type Parameters

#### R1

`R1`

#### E1

`E1`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1`, `S`, `E1`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>
