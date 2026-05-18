[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [sync](../README.md) / andThrough

# Function: andThrough()

> **andThrough**\<`T`, `R2`, `F`\>(`f`): \<`R1`, `E`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>

Defined in: [sync.ts:354](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L354)

Runs a fallible step for its side effect, then propagates the original
success value if the step succeeds.

## Type Parameters

### T

`T`

The success type (preserved through the step on success).

### R2

`R2`

The tee's requirements (intersected into the chain).

### F

`F`

The tee's error type (unioned with the chain's).

## Parameters

### f

(`t`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R2`, `unknown`, `F`\>

Function from the success value to a `ResultR` whose value is
  ignored on success.

## Returns

> \<`R1`, `E`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>

### Type Parameters

#### R1

`R1`

#### E

`E`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1`, `T`, `E`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `T`, `F` \| `E`\>

## Remarks

Like [andTee](andTee.md), but the tee step is itself a `ResultR` that can fail.
If the tee step returns `Err`, that error replaces the chain's value; if it
returns `Ok`, the chain continues with the *original* success value (the
tee's success value is discarded).

Common shape: validate a value via a fallible check without losing the
value itself.

## Example

```ts
import { errR, okR } from '@konker.dev/neverthrow-r/constructors';
import { andThrough } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const validated = pipe(
  okR<number>(2),
  andThrough((n) => (n > 0 ? okR<unknown>(undefined) : errR<string>('non-positive'))),
);

validated(undefined); // Ok(2)
```

## See

 - [andTee](andTee.md) for the infallible version.
 - andThroughAsync
