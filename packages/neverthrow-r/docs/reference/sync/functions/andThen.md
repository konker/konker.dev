[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [sync](../README.md) / andThen

# Function: andThen()

> **andThen**\<`A`, `R2`, `B`, `E2`\>(`f`): \<`R1`, `E1`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

Defined in: [sync.ts:25](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L25)

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

(`a`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R2`, `B`, `E2`\>

## Returns

> \<`R1`, `E1`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

### Type Parameters

#### R1

`R1`

#### E1

`E1`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1`, `A`, `E1`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>
