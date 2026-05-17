# v1 design: Reader-function `ResultR` over neverthrow

Status: **chosen**. This document specifies the v1 API for `neverthrow-r`.

## Goal

Add a third "requirements" / "dependencies" channel to neverthrow's `Result` and `ResultAsync`, inspired by effect-ts but deliberately small. Use neverthrow as a runtime dependency; do not re-implement its operators.

## Core types

```ts
import type { Result, ResultAsync } from 'neverthrow'

export type ResultR<R, T, E>       = (r: R) => Result<T, E>
export type ResultAsyncR<R, T, E>  = (r: R) => ResultAsync<T, E>
```

`R` defaults to `unknown` — meaning "requires nothing specific."

Why `unknown` and not `never`: in `(r: R) => ...` the `R` parameter is in contravariant position. `never` would make the function uncallable; `unknown` is the correct identity for "any input is acceptable."

Why a bare function and not a class wrapper: smallest possible representation, zero runtime, and `provide` is literally function application. The class-wrapper alternative is documented separately in `alternative-class-wrapper.md`.

## Channel composition

All operators that chain two `ResultR`s combine their requirement types with **intersection (`&`)**, because the resulting Reader function is called with one `r` that must satisfy both:

```ts
const andThen =
  <A, R2, B, E2>(f: (a: A) => ResultR<R2, B, E2>) =>
  <R1, E1>(rr: ResultR<R1, A, E1>): ResultR<R1 & R2, B, E1 | E2> =>
  (r) => rr(r).andThen((a) => f(a)(r))
```

Sync↔async bridges follow the same intersection rule, promoted to `ResultAsyncR<R1 & R2, ...>`.

## Operators (v1)

All exported as free functions from a flat barrel. Each is a one-line delegation to the underlying neverthrow operator.

### Constructors / lifters

- `okR<T, E = never>(t: T): ResultR<unknown, T, E>`
- `errR<E, T = never>(e: E): ResultR<unknown, T, E>`
- `fromResult<T, E>(r: Result<T, E>): ResultR<unknown, T, E>`
- `fromResultAsync<T, E>(ra: ResultAsync<T, E>): ResultAsyncR<unknown, T, E>`
- `asks<R, A>(f: (r: R) => A): ResultR<R, A, never>`
- `ask<R>(): ResultR<R, R, never>` — convenience for `asks(r => r)`

### Sync operators (over `ResultR`)

- `map<A, B>(f: (a: A) => B): <R, E>(rr) => ResultR<R, B, E>`
- `mapErr<E, F>(f: (e: E) => F): <R, T>(rr) => ResultR<R, T, F>`
- `andThen<A, R2, B, E2>(f: (a: A) => ResultR<R2, B, E2>): <R1, E1>(rr) => ResultR<R1 & R2, B, E1 | E2>`
- `orElse<E, R2, U, F>(f: (e: E) => ResultR<R2, U, F>): <R1, T>(rr) => ResultR<R1 & R2, T | U, F>`
- `match<T, E, A, B = A>(ok: (t: T) => A, err: (e: E) => B): <R>(rr) => (r: R) => A | B`
- `andTee<T>(f: (t: T) => unknown): <R, E>(rr) => ResultR<R, T, E>`
- `orTee<E>(f: (e: E) => unknown): <R, T>(rr) => ResultR<R, T, E>`
- `andThrough<T, R2, F>(f: (t: T) => ResultR<R2, unknown, F>): <R1, E>(rr) => ResultR<R1 & R2, T, E | F>`

### Sync↔async bridges (over `ResultR`, return `ResultAsyncR`)

- `asyncMap<A, B>(f: (a: A) => Promise<B>): <R, E>(rr) => ResultAsyncR<R, B, E>`
- `asyncAndThen<A, R2, B, E2>(f: (a: A) => ResultAsyncR<R2, B, E2>): <R1, E1>(rr) => ResultAsyncR<R1 & R2, B, E1 | E2>`
- `asyncAndThrough<T, R2, F>(f: (t: T) => ResultAsyncR<R2, unknown, F>): <R1, E>(rr) => ResultAsyncR<R1 & R2, T, E | F>`

### Async operators (over `ResultAsyncR`)

Same surface as sync — `map`, `mapErr`, `andThen`, `orElse`, `match`, `andTee`, `orTee`, `andThrough` — operating on `ResultAsyncR<R, T, E>`. Module-namespaced or suffixed in implementation to avoid collisions in the barrel; final naming TBD at implementation time.

### Do-notation (scope accumulator)

A `bind`-style do-notation for sequentially composing chains that accumulate intermediate values into a record-shaped "scope" while still threading R correctly. This is the ergonomic replacement for the deferred `safeTry` — it sidesteps the generator R-inference problem.

```ts
type Scope<Keys extends string> = Record<Keys, any>

type ExtendedScope<S extends Scope<any>, N extends string, A> =
  S extends any
    ? { [K in keyof S | N]: K extends N ? A : K extends keyof S ? S[K] : never }
    : never

doR<R = unknown>(): ResultR<R, {}, never>
doAsyncR<R = unknown>(): ResultAsyncR<R, {}, never>

bindR<N extends string, S extends Scope<any>, R2, A, E2>(
  name: N,
  f: (s: S) => ResultR<R2, A, E2>,
): <R1, E1>(rr: ResultR<R1, S, E1>) => ResultR<R1 & R2, ExtendedScope<S, N, A>, E1 | E2>

bindAsyncR<N extends string, S extends Scope<any>, R2, A, E2>(
  name: N,
  f: (s: S) => ResultAsyncR<R2, A, E2>,
): <R1, E1>(rr: ResultAsyncR<R1, S, E1>) => ResultAsyncR<R1 & R2, ExtendedScope<S, N, A>, E1 | E2>
```

Each `bindR` step:
- Intersects its `R2` into the accumulated requirements (`R1 & R2`).
- Adds a named field to the accumulated success scope.
- Unions the error type as usual.

The chain expresses both "what services this computation requires" and "what intermediate values it has produced," yielding a single `ResultR<AllDeps, FinalScope, AllErrors>` to terminate with `andThen`, `map`, or `provide`.

Sync→async bridge `bindR` → `bindAsyncR` follows the same intersection rule and promotes the chain to `ResultAsyncR`.

Lives in `src/do.ts`, re-exported from the barrel.

### Provision

```ts
provide<R, T, E>(rr: ResultR<R, T, E>, deps: R): Result<T, E>
provide<R, T, E>(rr: ResultAsyncR<R, T, E>, deps: R): ResultAsync<T, E>

provideSome<R, T, E, P extends Partial<R>>(
  rr: ResultR<R, T, E>,
  p: P,
): ResultR<Simplify<Omit<R, keyof P>>, T, E>
// + ResultAsyncR overload
```

Notes on `provideSome`:

- `R` must be a record type. `provideSome` over primitive or union `R` is unsupported.
- Provided keys are **whole-replaced**, not deep-merged. Partial provision of a single key's sub-fields is not supported.
- Runtime impl: `(r) => rr({ ...p, ...r })`.
- `Simplify` is a local utility that flattens intersection display: `type Simplify<T> = { [K in keyof T]: T[K] } & {}`.

No separate `run` function. Calling `rr(deps)` is the run; `provide` is the named alias for that with explicit type narrowing.

## Deferred to a future version

These are intentionally out of v1 scope:

- `combine`, `combineWithAllErrors` — tractable but require additional type-level machinery to intersect `R` across a heterogeneous list.
- `fromThrowable`, `fromPromise`, `fromSafePromise` — users can compose with neverthrow's equivalents inside `fromResult`/`fromResultAsync`.
- `safeTry` — making the generator R-aware requires a non-trivial typed-yield protocol. Users can use neverthrow's `safeTry` inside an `asks` callback.
- `unwrapOr` — return type changes from `Result` to `T`, deserves separate consideration.
- `safeUnwrap` — deprecated upstream, will not be added.
- `_unsafeUnwrap`/`_unsafeUnwrapErr` — not needed; `rr(testDeps)._unsafeUnwrap()` already works since `rr(testDeps)` returns a plain neverthrow `Result`.

## Naming

- Types: `ResultR`, `ResultAsyncR`.
- Constructors: `okR`, `errR`, `asks`, `ask`, `fromResult`, `fromResultAsync`.
- Operators: same verbs as neverthrow methods, exported as free functions.
- Provision: `provide`, `provideSome`.

Package name: **`neverthrow-r`**. The `-r` suffix mirrors the type-parameter convention used throughout the API (`ResultR`, `ResultAsyncR`, `okR`, `errR`, `doR`, `bindR`).

## Module layout

Flat barrel from `src/index.ts`. No namespacing. Tree-shakable. No collisions with neverthrow's exports because neverthrow's operators are methods, not free functions.

## `pipe`

`neverthrow-r` does not ship or depend on a `pipe` implementation. Operators are curried free functions designed to be used with any `pipe` the consumer prefers (or none — direct application works too).

This is deliberate: the library's purpose is to be a lightweight alternative to effect-ts, so taking on `effect` (or any other fp library) as a dependency just for `pipe` would defeat the point. Consumers bring their own.

## Non-goals

- No `Context` / `Tag` / service-locator machinery. Requirements are plain TypeScript types.
- No effect tracking beyond R/E/T.
- No scheduler, fiber, interruption, or other effect-ts runtime concepts.
- No re-implementation of neverthrow operators; every operator delegates.