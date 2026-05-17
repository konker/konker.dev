# Alternative design: class-wrapper `ResultR` with method chaining

Status: **not chosen**. Recorded for possible future revisit.

## Context

The chosen v1 design models `ResultR<R, T, E>` as a bare Reader function:

```ts
type ResultR<R, T, E> = (r: R) => Result<T, E>
```

All operators are free functions used with `pipe(...)`. This is the smallest possible thing — no runtime, no class, no allocation beyond the function itself.

The trade-off: **no method chaining**. Users write `pipe(rr, map(f), andThen(g))` instead of `rr.map(f).andThen(g)`. For teams accustomed to neverthrow's fluent `.map().andThen()` style, this is an ergonomic regression.

This document specifies the alternative — a thin class wrapper that restores method chaining — so it can be reconsidered if the pipe style proves painful in practice.

## Shape

```ts
class ResultR<R, T, E> {
  private constructor(private readonly _run: (r: R) => Result<T, E>) {}

  static of<R, T, E>(run: (r: R) => Result<T, E>): ResultR<R, T, E> {
    return new ResultR(run)
  }

  run(r: R): Result<T, E> {
    return this._run(r)
  }

  // instance methods mirror neverthrow's Result
  map<U>(f: (t: T) => U): ResultR<R, U, E>
  mapErr<F>(f: (e: E) => F): ResultR<R, T, F>
  andThen<R2, U, F>(f: (t: T) => ResultR<R2, U, F>): ResultR<R & R2, U, E | F>
  orElse<R2, U, F>(f: (e: E) => ResultR<R2, U, F>): ResultR<R & R2, T | U, F>
  match<A, B = A>(ok: (t: T) => A, err: (e: E) => B): (r: R) => A | B
  andTee(f: (t: T) => unknown): ResultR<R, T, E>
  orTee(f: (e: E) => unknown): ResultR<R, T, E>
  andThrough<R2, F>(f: (t: T) => ResultR<R2, unknown, F>): ResultR<R & R2, T, E | F>

  // sync -> async bridges return ResultAsyncR
  asyncMap<U>(f: (t: T) => Promise<U>): ResultAsyncR<R, U, E>
  asyncAndThen<R2, U, F>(f: (t: T) => ResultAsyncR<R2, U, F>): ResultAsyncR<R & R2, U, E | F>
  asyncAndThrough<R2, F>(f: (t: T) => ResultAsyncR<R2, unknown, F>): ResultAsyncR<R & R2, T, E | F>

  // provision
  provide(deps: R): Result<T, E>
  provideSome<P extends Partial<R>>(p: P): ResultR<Simplify<Omit<R, keyof P>>, T, E>
}

class ResultAsyncR<R, T, E> {
  // mirror structure, internal: (r: R) => ResultAsync<T, E>
}
```

`R` defaults to `unknown`. Static constructors `ok`, `err`, `asks`, `ask`, `fromResult`, `fromResultAsync` produce instances.

## Equivalences with the chosen design

| Chosen (Reader function)           | Alternative (class wrapper)        |
| ---------------------------------- | ---------------------------------- |
| `rr(deps)`                         | `rr.run(deps)` or `rr.provide(deps)` |
| `pipe(rr, map(f))`                 | `rr.map(f)`                        |
| `pipe(rr, andThen(f))`             | `rr.andThen(f)`                    |
| `provide(rr, deps)`                | `rr.provide(deps)`                 |
| `provideSome(rr, p)`               | `rr.provideSome(p)`                |
| `asks(f)`                          | `ResultR.asks(f)`                  |
| `fromResult(r)`                    | `ResultR.fromResult(r)`            |

Semantics are identical. `R1 & R2` intersection rules, whole-key replacement in `provideSome`, async bridges all behave the same.

## Why this was not chosen for v1

1. **Scope creep.** The chosen design is ~50–100 lines of types and one-line operator implementations. The class version is ~300–500 lines of delegating method bodies plus duplicated overload sets for both `ResultR` and `ResultAsyncR`.

2. **Allocation overhead.** Every operator creates a new class instance. For long chains this is measurable; the Reader-function version allocates only the closures TS would create either way.

3. **Two ways to do it.** The class wrapper still needs an internal `(r: R) => Result<T, E>`. The Reader function design exposes that directly, so users who want pipe-style get it for free without a second API surface.

4. **Bridges are clunkier.** `ResultR.asyncAndThen` has to construct a `ResultAsyncR` — a second class — meaning each bridge operator crosses a class boundary. The function design just changes the return type.

## When to revisit

Reconsider this alternative if:

- Users on the team consistently complain about pipe ergonomics or import noise from `pipe`.
- The library is adopted outside this monorepo and external users expect neverthrow-shaped fluent APIs.
- TypeScript inference for accumulating intersection R types proves more reliable on methods (`this`-typed chains) than on curried free functions.
- A future version of TS introduces native pipe (`|>`) that closes the ergonomic gap — at that point the class wrapper loses its main argument and this doc can be deleted.

## Migration cost (chosen → alternative)

Low. The Reader-function `ResultR` becomes the class's private `_run` field. Free-function operators become method delegations. Public type names stay the same (`ResultR`, `ResultAsyncR`) so consumer types don't change — only call sites do, and a codemod converting `pipe(rr, op(args))` → `rr.op(args)` is straightforward.