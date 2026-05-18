[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [sync](../README.md) / andThen

# Function: andThen()

> **andThen**\<`A`, `R2`, `B`, `E2`\>(`f`): \<`R1`, `E1`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

Defined in: [sync.ts:158](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L158)

Chains another `ResultR`-returning step onto a successful result.

## Type Parameters

### A

`A`

The previous step's success type.

### R2

`R2`

The continuation's requirements.

### B

`B`

The continuation's success type.

### E2

`E2`

The continuation's error type.

## Parameters

### f

(`a`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R2`, `B`, `E2`\>

Function from the previous success value to a `ResultR`.

## Returns

A function taking a `ResultR<R1, A, E1>` and returning a
  `ResultR<R1 & R2, B, E1 | E2>`.

> \<`R1`, `E1`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

### Type Parameters

#### R1

`R1`

#### E1

`E1`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1`, `A`, `E1`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `B`, `E2` \| `E1`\>

## Remarks

This is the workhorse for sequencing computations that each may fail. The
continuation `f` receives the previous step's success value and returns a
new `ResultR` whose requirements `R2` are **intersected** into the chain
(`R1 & R2`) and whose error type `E2` is **unioned** with the chain's
(`E1 | E2`).

If the previous step is an `Err`, `f` is not called and the error
propagates.

For multi-step chains that accumulate intermediate values into a named
scope, prefer the do-notation helpers in [do](../../do/README.md).

## Example

```ts
import { asks, okR } from '@konker.dev/neverthrow-r/constructors';
import { andThen } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

type Config = { factor: number };

const program = pipe(
  okR<number>(2),
  andThen((n) => asks((r: Config) => n * r.factor)),
);

program({ factor: 10 }); // Ok(20)
```

## See

 - [orElse](orElse.md) for the error-channel mirror.
 - [andThrough](andThrough.md) for a chain that returns the previous value.
 - andThenAsync
 - bindR
