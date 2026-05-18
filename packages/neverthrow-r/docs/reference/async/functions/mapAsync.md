[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [async](../README.md) / mapAsync

# Function: mapAsync()

> **mapAsync**\<`A`, `B`\>(`f`): \<`R`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

Defined in: [async.ts:52](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L52)

Async variant of map. Accepts a sync- or `Promise`-returning
transform.

## Type Parameters

### A

`A`

### B

`B`

## Parameters

### f

(`a`) => `B` \| `Promise`\<`B`\>

## Returns

> \<`R`, `E`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

### Type Parameters

#### R

`R`

#### E

`E`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `A`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

## Example

```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { mapAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const doubled = pipe(okAsyncR<number>(2), mapAsync(async (n) => n * 2));
```

## See

map
