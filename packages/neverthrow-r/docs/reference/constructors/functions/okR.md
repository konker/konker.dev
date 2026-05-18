[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [constructors](../README.md) / okR

# Function: okR()

> **okR**\<`T`, `E`\>(`value`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`unknown`, `T`, `E`\>

Defined in: [constructors.ts:70](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/constructors.ts#L70)

Lifts a plain success value into a `ResultR` with no requirements.

## Type Parameters

### T

`T`

The success type.

### E

`E` = `never`

The error type (defaults to `never` since this always
  succeeds).

## Parameters

### value

`T`

The value to wrap in an `Ok`.

## Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`unknown`, `T`, `E`\>

A `ResultR<unknown, T, E>` that ignores its environment and yields
  `Ok(value)`.

## Remarks

Equivalent to `() => ok(value)`. The `R` parameter defaults to `unknown`
because the constructor doesn't read from the environment.

## Example

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';

const two = okR<number>(2);
two(undefined); // Ok(2)
```

## See

 - [errR](errR.md)
 - [okAsyncR](okAsyncR.md)
