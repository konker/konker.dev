[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [sync](../README.md) / andTee

# Function: andTee()

> **andTee**\<`T`\>(`f`): \<`R`, `E`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

Defined in: [sync.ts:277](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L277)

Runs a side effect with the success value, propagating the value unchanged.

## Type Parameters

### T

`T`

The success type (preserved through the step).

## Parameters

### f

(`t`) => `unknown`

Side-effecting callback receiving the success value.

## Returns

> \<`R`, `E`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

### Type Parameters

#### R

`R`

#### E

`E`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

## Remarks

Pass-through combinator for logging, telemetry, or any other observe-only
step. The callback's return value is discarded; the chain continues with
the original `T`. The callback is not invoked when the chain is in `Err`.

## Example

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { andTee } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const traced = pipe(
  okR<number>(2),
  andTee((n) => console.log('saw', n)),
);

traced(undefined); // logs 'saw 2', returns Ok(2)
```

## See

 - [orTee](orTee.md)
 - [andThrough](andThrough.md) for a tee that can itself fail.
 - andTeeAsync
