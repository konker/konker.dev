[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [async](../README.md) / andTeeAsync

# Function: andTeeAsync()

> **andTeeAsync**\<`T`\>(`f`): \<`R`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

Defined in: [async.ts:171](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L171)

Async variant of andTee.

## Type Parameters

### T

`T`

## Parameters

### f

(`t`) => `unknown`

## Returns

> \<`R`, `E`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

### Type Parameters

#### R

`R`

#### E

`E`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

## Example

```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { andTeeAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const traced = pipe(okAsyncR<number>(2), andTeeAsync((n) => console.log(n)));
```

## See

andTee
