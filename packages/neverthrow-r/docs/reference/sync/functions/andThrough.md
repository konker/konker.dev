[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [sync](../README.md) / andThrough

# Function: andThrough()

> **andThrough**\<`T`, `R2`, `F`\>(`f`): \<`R1`, `E`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>

Defined in: [sync.ts:55](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L55)

## Type Parameters

### T

`T`

### R2

`R2`

### F

`F`

## Parameters

### f

(`t`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R2`, `unknown`, `F`\>

## Returns

> \<`R1`, `E`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>

### Type Parameters

#### R1

`R1`

#### E

`E`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1`, `T`, `E`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>
