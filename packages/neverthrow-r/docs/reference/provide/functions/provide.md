[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [provide](../README.md) / provide

# Function: provide()

## Call Signature

> **provide**\<`R`, `T`, `E`\>(`rr`, `deps`): `Result`\<`T`, `E`\>

Defined in: [provide.ts:72](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/provide.ts#L72)

Supplies the environment to a `ResultR` (or `ResultAsyncR`) and returns
the underlying neverthrow value.

### Type Parameters

#### R

`R`

The requirements being supplied.

#### T

`T`

The success type.

#### E

`E`

The error type.

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

The `ResultR` or `ResultAsyncR` to provide for.

#### deps

`R`

The environment.

### Returns

`Result`\<`T`, `E`\>

### Remarks

Equivalent to calling `rr(deps)` directly, but named for intent and
overloaded so the return type tracks whether the input is sync or async.

Typically the final call in a pipeline: composition builds a `ResultR<R, T,
E>`; `provide` discharges `R`.

### Examples

Sync:
```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { provide } from '@konker.dev/neverthrow-r/provide';

provide(okR<number>(2), undefined); // Ok(2)
```

Async:
```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { provide } from '@konker.dev/neverthrow-r/provide';

provide(okAsyncR<number>(2), undefined); // ResultAsync resolving to Ok(2)
```

### See

[provideSome](provideSome.md)

## Call Signature

> **provide**\<`R`, `T`, `E`\>(`rr`, `deps`): `ResultAsync`\<`T`, `E`\>

Defined in: [provide.ts:73](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/provide.ts#L73)

Supplies the environment to a `ResultR` (or `ResultAsyncR`) and returns
the underlying neverthrow value.

### Type Parameters

#### R

`R`

The requirements being supplied.

#### T

`T`

The success type.

#### E

`E`

The error type.

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

The `ResultR` or `ResultAsyncR` to provide for.

#### deps

`R`

The environment.

### Returns

`ResultAsync`\<`T`, `E`\>

### Remarks

Equivalent to calling `rr(deps)` directly, but named for intent and
overloaded so the return type tracks whether the input is sync or async.

Typically the final call in a pipeline: composition builds a `ResultR<R, T,
E>`; `provide` discharges `R`.

### Examples

Sync:
```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { provide } from '@konker.dev/neverthrow-r/provide';

provide(okR<number>(2), undefined); // Ok(2)
```

Async:
```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { provide } from '@konker.dev/neverthrow-r/provide';

provide(okAsyncR<number>(2), undefined); // ResultAsync resolving to Ok(2)
```

### See

[provideSome](provideSome.md)
