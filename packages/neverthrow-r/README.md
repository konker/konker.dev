# neverthrow-r

An extension for [neverthrow](https://github.com/supermacro/neverthrow) that adds a third channel — `R`, for requirements / dependencies — to `Result` and `ResultAsync`.

Inspired by effect-ts, but deliberately small: `neverthrow-r` is a thin layer of curried, pipe-friendly functions over neverthrow. There is no runtime, no context machinery, no scheduler — just two type aliases and a set of operators that thread an `R` parameter through your existing neverthrow chains.

## Install

```sh
pnpm add @konker.dev/neverthrow-r neverthrow
```

`neverthrow` is a peer dependency.

## Core types

```ts
type ResultR<R, T, E> = (r: R) => Result<T, E>;
type ResultAsyncR<R, T, E> = (r: R) => ResultAsync<T, E>;
```

A value of type `ResultR<R, T, E>` is a function that, given an `R`, produces a neverthrow `Result<T, E>`. `R` defaults to `unknown` (no specific requirements).

When two steps are chained, their requirement types are combined with intersection: a chain of `ResultR<R1, A, E1>` and `(a: A) => ResultR<R2, B, E2>` produces `ResultR<R1 & R2, B, E1 | E2>`.

## `pipe`

`neverthrow-r` ships a small value-piping `pipe` implementation. It applies functions from left to right, preserves the inferred output type through the chain, and supports up to 20 function arguments:

```ts
import { pipe } from '@konker.dev/neverthrow-r';
```

If you already use a value-piping `pipe` from another library (e.g. `effect`, `fp-ts`, `remeda`), the operators remain shape-compatible with those too.

## Quick example

```ts
import { andThen, asks, pipe, provide, type ResultR } from '@konker.dev/neverthrow-r';

const loadUser =
  (id: string): ResultR<{ db: Db }, User, DbError> =>
  (r) =>
    r.db.findUser(id);

const greet = (user: User): ResultR<{ logger: Logger }, string, never> =>
  asks((r) => {
    r.logger.info(`greeting ${user.name}`);
    return `Hello, ${user.name}`;
  });

const program = (id: string) => pipe(loadUser(id), andThen(greet));
//    ^? ResultR<{ db: Db } & { logger: Logger }, string, DbError>

const result = provide(program('u-1'), { db, logger });
//    ^? Result<string, DbError>
```

Note how `program`'s requirement type is the _intersection_ of the two steps' requirements — that intersection is built up automatically as you chain.

## Async example with do-notation

```ts
import { okAsync } from 'neverthrow';
import { bindAsyncR, doAsyncR, fromResultAsync, pipe, provide } from '@konker.dev/neverthrow-r';

const program = pipe(
  doAsyncR(),
  bindAsyncR('user', () => (r: { db: Db }) => r.db.findUserAsync('u-1')),
  bindAsyncR('greeting', ({ user }) => fromResultAsync(okAsync(`Hello, ${user.name}`)))
);

const result = await provide(program, { db });
// result.value === { user: User, greeting: string }
```

Each `bindAsyncR` step:

- accumulates a named value onto the success scope,
- contributes its own requirements to the chain's `R`,
- short-circuits the whole chain on the first `Err`.

Note that `doAsyncR()` (and `doR()`) is called without a generic type argument here. `R` defaults to `unknown` and the chain's accumulated requirements are built up automatically by each `bindAsyncR` step — because `unknown & X = X`. You only need an explicit `doAsyncR<MyEnv>()` if you want to _constrain_ the chain to a known environment up front (so that subsequent steps requiring anything outside `MyEnv` become type errors).

## Partial provision

```ts
import { provideSome } from '@konker.dev/neverthrow-r';

declare const program: ResultR<{ db: Db; logger: Logger }, User, Error>;

// inject the logger now, leave db for later
const stillNeedsDb = provideSome(program, { logger });
//  ^? ResultR<{ db: Db }, User, Error>

const result = provide(stillNeedsDb, { db });
```

`provideSome` whole-replaces the provided keys (no deep merge); the returned `ResultR` requires whatever keys were not provided.

## API

### Constructors

- `okR(value)`, `errR(error)` — lift into `ResultR`
- `okAsyncR(value)`, `errAsyncR(error)` — lift into `ResultAsyncR`
- `fromResult(r)`, `fromResultAsync(ra)` — lift an existing neverthrow value
- `asks(f)` — build a `ResultR` from a selector over the environment
- `ask()` — `asks(r => r)`, returns the full environment

### Pipe

`pipe(value, ...fns)` — apply up to 20 unary functions from left to right.

### Sync operators (over `ResultR`)

`map`, `mapErr`, `andThen`, `orElse`, `match`, `andTee`, `orTee`, `andThrough`

### Async operators (over `ResultAsyncR`)

`mapAsync`, `mapErrAsync`, `andThenAsync`, `orElseAsync`, `matchAsync`, `andTeeAsync`, `orTeeAsync`, `andThroughAsync`

### Sync → async bridges

`asyncMap`, `asyncAndThen`, `asyncAndThrough` — take a `ResultR`, return a `ResultAsyncR`.

### Do-notation

`doR`, `bindR`, `doAsyncR`, `bindAsyncR` — accumulate named values into a success-channel scope while threading `R`.

### Provision

- `provide(rr, deps)` — supply all requirements, return the underlying `Result` / `ResultAsync`.
- `provideSome(rr, partial)` — supply some requirements, return a `ResultR` over the remaining ones.

## License

ISC
