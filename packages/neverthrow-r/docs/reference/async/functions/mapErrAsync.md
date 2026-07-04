[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [async](../README.md) / mapErrAsync

# Function: mapErrAsync()

> **mapErrAsync**\<`E`, `F`\>(`f`): \<`R`, `T`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `F`\>

Defined in: [async.ts:76](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L76)

Async variant of mapErr. Accepts a sync- or `Promise`-returning
transform.

## Type Parameters

### E

`E`

### F

`F`

## Parameters

### f

(`e`) => `F` \| `Promise`\<`F`\>

## Returns

\<`R`, `T`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `F`\>

## Example

```ts
import { errAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { mapErrAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const wrapped = pipe(
  errAsyncR<string>('boom'),
  mapErrAsync(async (msg) => ({ tag: 'fail' as const, msg })),
);
```

## See

mapErr
