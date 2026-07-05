[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [async](../README.md) / orElseAsync

# Function: orElseAsync()

> **orElseAsync**\<`E`, `R2`, `U`, `F`\>(`f`): \<`R1`, `T`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T` \| `U`, `F`\>

Defined in: [async.ts:123](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L123)

Async variant of orElse. The recovery returns a `ResultAsyncR`.

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

(`e`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `U`, `F`\>

## Returns

\<`R1`, `T`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T` \| `U`, `F`\>

## Example

```ts
import { errAsyncR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { orElseAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const withFallback = pipe(
  errAsyncR<string, number>('boom'),
  orElseAsync(() => okAsyncR<number>(0)),
);
```

## See

orElse
