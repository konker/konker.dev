[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [bridges](../README.md) / asyncMap

# Function: asyncMap()

> **asyncMap**\<`A`, `B`\>(`f`): \<`R`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

Defined in: [bridges.ts:13](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/bridges.ts#L13)

## Type Parameters

### A

`A`

### B

`B`

## Parameters

### f

(`a`) => `Promise`\<`B`\>

## Returns

> \<`R`, `E`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

### Type Parameters

#### R

`R`

#### E

`E`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `A`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>
