# `@konker.dev/neverthrow-r`

A thin Reader-function layer over [neverthrow](https://github.com/supermacro/neverthrow). Every value is a function `(r: R) => Result<T, E>` (or its async sibling), so dependencies travel through a third **requirements** channel `R` alongside the usual `T` / `E` of `Result`.

## The core idea

A regular neverthrow value carries two channels: the success type `T` and the error type `E`.

```ts
import type { Result } from 'neverthrow';
declare const r: Result<number, string>;
```

`neverthrow-r` adds a third channel — `R`, the _requirements_ — by wrapping the `Result` in a unary function:

```ts
import type { ResultR } from '@konker.dev/neverthrow-r/types';
declare const rr: ResultR<{ db: unknown }, number, string>;
//                       ^^^^^^^^^^^^^^^   ^^^^^^   ^^^^^^
//                       requirements      success  error
```

Operators like `map`, `andThen`, etc. thread `R` automatically and **intersect** requirements across composed steps (`R1 & R2`). When you finally have a concrete environment, [`provide`](./provide/README.md) supplies it and yields the underlying `Result`.

## Pick your module

| Start with    | Module                                     | Use when                                                                                                                                |
| ------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Building**  | [`constructors`](./constructors/README.md) | Lifting plain values, an existing `Result`, or the environment itself into a `ResultR`.                                                 |
| **Composing** | [`sync`](./sync/README.md)                 | Sync combinators over `ResultR`: `map`, `mapErr`, `andThen`, `orElse`, `match`, `andTee`, …                                             |
|               | [`async`](./async/README.md)               | The `*Async` counterparts over `ResultAsyncR`.                                                                                          |
|               | [`bridges`](./bridges/README.md)           | Promoting a sync `ResultR` to async mid-pipeline (`asyncMap`, `asyncAndThen`, `asyncAndThrough`).                                       |
|               | [`do`](./do/README.md)                     | Multi-step chains that accumulate intermediate results into a named scope.                                                              |
|               | [`pipe`](./pipe/README.md)                 | Left-to-right composition of curried operators (up to 20 arities).                                                                      |
| **Finishing** | [`provide`](./provide/README.md)           | Supplying the environment to a `ResultR` to obtain a `Result` / `ResultAsync`. Or `provideSome` to satisfy a subset and leave the rest. |
| **Reference** | [`types`](./types/README.md)               | Type-level vocabulary: `ResultR`, `ResultAsyncR`, `Scope`, `Simplify`.                                                                  |

## A worked example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { andThen, map } from '@konker.dev/neverthrow-r/sync';
import { provide } from '@konker.dev/neverthrow-r/provide';
import type { ResultR } from '@konker.dev/neverthrow-r/types';

type Deps = { multiplier: number };

const double =
  (n: number): ResultR<Deps, number, never> =>
  (r) =>
    okR<number>(n * r.multiplier)(undefined);

const result = pipe(
  okR<number>(2),
  map((n) => n + 1),
  andThen(double)
);

provide(result, { multiplier: 10 }); // Ok(30)
```

See each module's reference page for the full API.
