[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [types](../README.md) / ResultR

# Type Alias: ResultR()\<R, T, E\>

> **ResultR**\<`R`, `T`, `E`\> = (`r`) => `Result`\<`T`, `E`\>

Defined in: [types.ts:79](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/types.ts#L79)

A `Result<T, E>` that requires an environment `R` to produce.

## Type Parameters

### R

`R`

The requirements (environment) the value depends on.

### T

`T`

The success type.

### E

`E`

The error type.

## Parameters

### r

`R`

## Returns

`Result`\<`T`, `E`\>

## Remarks

`ResultR<R, T, E>` is structurally `(r: R) => Result<T, E>`. The `R` channel
is the third dimension this package adds on top of `neverthrow`: it makes
dependencies (database handles, config, clocks, …) explicit in the type
rather than implicit in the closure.

Use `unknown` for `R` when no environment is required (most often via the
default on constructors like okR).

Composition operators in [sync](../../sync/README.md) and [do](../../do/README.md) intersect `R` across
steps, so `R1 & R2 & R3` falls out of `andThen`-style chains automatically.

## Example

```ts
import type { ResultR } from '@konker.dev/neverthrow-r/types';
import { ok } from 'neverthrow';

type Deps = { now: () => Date };

const currentYear: ResultR<Deps, number, never> =
  (r) => ok(r.now().getFullYear());
```

## See

 - [ResultAsyncR](ResultAsyncR.md) for the async sibling.
 - [provide](../../provide/README.md) for supplying the environment.
