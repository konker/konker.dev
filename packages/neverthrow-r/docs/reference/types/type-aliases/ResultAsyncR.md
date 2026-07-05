[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [types](../README.md) / ResultAsyncR

# Type Alias: ResultAsyncR\<R, T, E\>

> **ResultAsyncR**\<`R`, `T`, `E`\> = (`r`) => `ResultAsync`\<`T`, `E`\>

Defined in: [types.ts:105](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/types.ts#L105)

A `ResultAsync<T, E>` that requires an environment `R` to produce.

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

`ResultAsync`\<`T`, `E`\>

## Remarks

The async sibling of [ResultR](ResultR.md). Structurally `(r: R) => ResultAsync<T, E>`.
Combine sync and async values in one pipeline via the [bridges](../../bridges/README.md) module.

## Example

```ts
import type { ResultAsyncR } from '@konker.dev/neverthrow-r/types';
import { okAsync } from 'neverthrow';

type Deps = { fetch: (url: string) => Promise<unknown> };

const fetchJson: (url: string) => ResultAsyncR<Deps, unknown, never> =
  (url) => (r) => okAsync(undefined).map(() => r.fetch(url));
```

## See

[ResultR](ResultR.md) for the sync version.
