[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [bridges](../README.md) / asyncAndThrough

# Function: asyncAndThrough()

> **asyncAndThrough**\<`T`, `R2`, `F`\>(`f`): \<`R1`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `E` \| `F`\>

Defined in: [bridges.ts:144](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/bridges.ts#L144)

Promotes a `ResultR` to a `ResultAsyncR` via a fallible async tee that
propagates the *original* success value.

## Type Parameters

### T

`T`

The success type (preserved through the step on success).

### R2

`R2`

The tee's requirements.

### F

`F`

The tee's error type.

## Parameters

### f

(`t`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `unknown`, `F`\>

Function from the success value to a `ResultAsyncR` whose value
  is ignored on success.

## Returns

\<`R1`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `T`, `E` \| `F`\>

## Remarks

Sync→async sibling of andThrough. The tee step is itself a
`ResultAsyncR` that can fail; on success its value is discarded and the
chain continues with the original success value.

## Example

```ts
import { okAsyncR, okR } from '@konker.dev/neverthrow-r/constructors';
import { asyncAndThrough } from '@konker.dev/neverthrow-r/bridges';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(
  okR<number>(2),
  asyncAndThrough((n) => okAsyncR<unknown>(`logged ${n}`)),
);

program(undefined); // ResultAsync resolving to Ok(2)
```

## See

 - andThrough
 - andThroughAsync
