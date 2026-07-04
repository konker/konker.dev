[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [sync](../README.md) / orElse

# Function: orElse()

> **orElse**\<`E`, `R2`, `U`, `F`\>(`f`): \<`R1`, `T`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `U` \| `T`, `F`\>

Defined in: [sync.ts:197](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L197)

Recovers from an `Err` by running another `ResultR`-returning step.

## Type Parameters

### E

`E`

The previous step's error type.

### R2

`R2`

The recovery's requirements.

### U

`U`

The recovery's success type.

### F

`F`

The recovery's error type.

## Parameters

### f

(`e`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R2`, `U`, `F`\>

Function from the previous error to a recovery `ResultR`.

## Returns

\<`R1`, `T`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, `U` \| `T`, `F`\>

## Remarks

The error-channel mirror of [andThen](andThen.md): `f` is called only when the
previous step is an `Err`. The recovery's requirements `R2` are intersected
(`R1 & R2`) and its success type `U` is unioned with the original `T`
(`T | U`). The recovery itself can still fail, with its own error type `F`.

## Example

```ts
import { errR, okR } from '@konker.dev/neverthrow-r/constructors';
import { orElse } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const withFallback = pipe(
  errR<string, number>('boom'),
  orElse(() => okR<number>(0)),
);

withFallback(undefined); // Ok(0)
```

## See

 - [andThen](andThen.md)
 - orElseAsync
