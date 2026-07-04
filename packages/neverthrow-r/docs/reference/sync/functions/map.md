[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [sync](../README.md) / map

# Function: map()

> **map**\<`A`, `B`\>(`f`): \<`R`, `E`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `B`, `E`\>

Defined in: [sync.ts:70](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L70)

Transforms the success value of a `ResultR` with a pure function.

## Type Parameters

### A

`A`

The input success type.

### B

`B`

The output success type.

## Parameters

### f

(`a`) => `B`

Pure transformation from `A` to `B`.

## Returns

A function taking a `ResultR<R, A, E>` and returning a
  `ResultR<R, B, E>`.

\<`R`, `E`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `B`, `E`\>

## Remarks

Threads `R` and `E` through unchanged; only `T` changes. The wrapped
function `f` is not called when the underlying `Result` is an `Err`.

To transform the error channel instead, see [mapErr](mapErr.md). To compose
with another `ResultR`-returning step, use [andThen](andThen.md). For side
effects on the success value without changing it, use [andTee](andTee.md).

## Example

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { map } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const doubled = pipe(okR<number>(2), map((n) => n * 2));
doubled(undefined); // Ok(4)
```

## See

 - [mapErr](mapErr.md)
 - [andThen](andThen.md)
 - mapAsync
