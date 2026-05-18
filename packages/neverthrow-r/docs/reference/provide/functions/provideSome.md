[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [provide](../README.md) / provideSome

# Function: provideSome()

## Call Signature

> **provideSome**\<`R`, `T`, `E`, `P`\>(`rr`, `partial`): [`ResultR`](../../types/type-aliases/ResultR.md)\<\{ \[K in string \| number \| symbol\]: Omit\<R, keyof P\>\[K\] \}, `T`, `E`\>

Defined in: [provide.ts:24](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/provide.ts#L24)

### Type Parameters

#### R

`R`

#### T

`T`

#### E

`E`

#### P

`P` *extends* `Partial`\<`R`\>

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

#### partial

`P`

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<\{ \[K in string \| number \| symbol\]: Omit\<R, keyof P\>\[K\] \}, `T`, `E`\>

## Call Signature

> **provideSome**\<`R`, `T`, `E`, `P`\>(`rr`, `partial`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<\{ \[K in string \| number \| symbol\]: Omit\<R, keyof P\>\[K\] \}, `T`, `E`\>

Defined in: [provide.ts:28](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/provide.ts#L28)

### Type Parameters

#### R

`R`

#### T

`T`

#### E

`E`

#### P

`P` *extends* `Partial`\<`R`\>

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

#### partial

`P`

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<\{ \[K in string \| number \| symbol\]: Omit\<R, keyof P\>\[K\] \}, `T`, `E`\>
