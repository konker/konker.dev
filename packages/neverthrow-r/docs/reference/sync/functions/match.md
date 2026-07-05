[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [sync](../README.md) / match

# Function: match()

> **match**\<`T`, `E`, `A`, `B`\>(`okFn`, `errFn`): \<`R`\>(`rr`) => (`r`) => `A` \| `B`

Defined in: [sync.ts:241](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L241)

Eliminates a `ResultR` into a single value by handling both branches.

## Type Parameters

### T

`T`

The success type.

### E

`E`

The error type.

### A

`A`

The result type of the `Ok` branch.

### B

`B` = `A`

The result type of the `Err` branch (defaults to `A`).

## Parameters

### okFn

(`t`) => `A`

Handler for the success branch.

### errFn

(`e`) => `B`

Handler for the error branch.

## Returns

\<`R`\>(`rr`) => (`r`) => `A` \| `B`

## Remarks

Unlike the other combinators, `match` does not return a `ResultR` — it
collapses the chain into a plain value. Both branch functions can return
the same type, or different types that get unioned.

The result is still a function of the environment `R`, so calling it
requires providing `R` directly (or pulling it via [provide](../../provide/README.md)).

## Example

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { match } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const rendered = pipe(
  okR<number>(42),
  match(
    (n) => `got ${n}`,
    (e: never) => `error: ${String(e)}`,
  ),
);

rendered(undefined); // 'got 42'
```

## See

matchAsync
