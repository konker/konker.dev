[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [sync](../README.md) / orElse

# Function: orElse()

> **orElse**\<`E`, `R2`, `U`, `F`\>(`f`): \<`R1`, `T`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `U` \| `T`, `F`\>

Defined in: [sync.ts:31](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L31)

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

(`e`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R2`, `U`, `F`\>

## Returns

> \<`R1`, `T`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `U` \| `T`, `F`\>

### Type Parameters

#### R1

`R1`

#### T

`T`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1`, `T`, `E`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `U` \| `T`, `F`\>
