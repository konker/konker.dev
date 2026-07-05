[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [async](../README.md) / andThroughAsync

# Function: andThroughAsync()

> **andThroughAsync**\<`T`, `R2`, `F`\>(`f`): \<`R1`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `E` \| `F`\>

Defined in: [async.ts:216](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L216)

Async variant of andThrough.

## Type Parameters

### T

`T`

### R2

`R2`

### F

`F`

## Parameters

### f

(`t`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `unknown`, `F`\>

## Returns

\<`R1`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `E` \| `F`\>

## Example

```ts
import { errAsyncR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { andThroughAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const validated = pipe(
  okAsyncR<number>(2),
  andThroughAsync((n) =>
    n > 0 ? okAsyncR<unknown>(undefined) : errAsyncR<string>('non-positive'),
  ),
);
```

## See

andThrough
