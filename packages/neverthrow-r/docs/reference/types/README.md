[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../modules.md) / types

# types

Type-level vocabulary for the package: the `ResultR` / `ResultAsyncR` shapes
that add a *requirements* channel on top of `neverthrow`'s `Result` /
`ResultAsync`, plus the helper types (`Scope`, `ExtendedScope`, `Simplify`)
used by do-notation and intersection flattening.

## Remarks

Most users only need [ResultR](type-aliases/ResultR.md) and [ResultAsyncR](type-aliases/ResultAsyncR.md). The remaining
exports are surfaced because the do-notation helpers (`bindR`, `bindAsyncR`)
expose them in their return types, so consumers may encounter them in
inferred types.

Every operator across the package — sync, async, bridges, do — preserves the
R/T/E shape and **intersects** the `R` channel across composed steps
(`R1 & R2`), so requirements accumulate as a chain is built.

## Example

Lift a value, transform it, accumulate requirements, then provide them:

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { andThen, map } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';
import { provide } from '@konker.dev/neverthrow-r/provide';
import type { ResultR } from '@konker.dev/neverthrow-r/types';

type WithMultiplier = { multiplier: number };

const scaled = (n: number): ResultR<WithMultiplier, number, never> =>
  (r) => okR<number>(n * r.multiplier)(undefined);

const program = pipe(
  okR<number>(2),
  map((n) => n + 1),
  andThen(scaled),
);

provide(program, { multiplier: 10 }); // Ok(30)
```

## Type Aliases

- [ExtendedScope](type-aliases/ExtendedScope.md)
- [ResultAsyncR](type-aliases/ResultAsyncR.md)
- [ResultR](type-aliases/ResultR.md)
- [Scope](type-aliases/Scope.md)
- [Simplify](type-aliases/Simplify.md)
