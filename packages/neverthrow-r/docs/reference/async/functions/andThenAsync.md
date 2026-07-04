[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [async](../README.md) / andThenAsync

# Function: andThenAsync()

> **andThenAsync**\<`A`, `R2`, `B`, `E2`\>(`f`): \<`R1`, `E1`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

Defined in: [async.ts:100](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L100)

Async variant of andThen. The continuation returns a
`ResultAsyncR`; its requirements intersect into the chain.

## Type Parameters

### A

`A`

### R2

`R2`

### B

`B`

### E2

`E2`

## Parameters

### f

(`a`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `B`, `E2`\>

## Returns

\<`R1`, `E1`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

## Example

```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { andThenAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(
  okAsyncR<number>(2),
  andThenAsync((n) => okAsyncR<string>(`got ${n}`)),
);
```

## See

andThen
