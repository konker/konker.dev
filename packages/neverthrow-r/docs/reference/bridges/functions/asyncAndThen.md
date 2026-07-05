[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [bridges](../README.md) / asyncAndThen

# Function: asyncAndThen()

> **asyncAndThen**\<`A`, `R2`, `B`, `E2`\>(`f`): \<`R1`, `E1`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

Defined in: [bridges.ts:105](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/bridges.ts#L105)

Promotes a `ResultR` to a `ResultAsyncR` by chaining a
`ResultAsyncR`-returning step.

## Type Parameters

### A

`A`

The previous step's success type.

### R2

`R2`

The continuation's requirements.

### B

`B`

The continuation's success type.

### E2

`E2`

The continuation's error type.

## Parameters

### f

(`a`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `B`, `E2`\>

Function from the previous success value to a `ResultAsyncR`.

## Returns

\<`R1`, `E1`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

## Remarks

Sync→async sibling of andThen. The continuation's requirements
`R2` are intersected (`R1 & R2`); its error type `E2` is unioned
(`E1 | E2`).

## Example

```ts
import { okAsyncR, okR } from '@konker.dev/neverthrow-r/constructors';
import { asyncAndThen } from '@konker.dev/neverthrow-r/bridges';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(
  okR<number>(2),
  asyncAndThen((n) => okAsyncR<string>(`got ${n}`)),
);

program(undefined); // ResultAsync resolving to Ok('got 2')
```

## See

 - andThen
 - andThenAsync
