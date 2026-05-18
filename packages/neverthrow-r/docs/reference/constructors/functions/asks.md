[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [constructors](../README.md) / asks

# Function: asks()

> **asks**\<`R`, `A`\>(`f`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `A`, `never`\>

Defined in: [constructors.ts:219](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/constructors.ts#L219)

Builds a `ResultR` whose value is computed from the environment. This is
how requirements are *introduced* into a chain.

## Type Parameters

### R

`R`

The requirements (environment) read from.

### A

`A`

The value computed from the environment.

## Parameters

### f

(`r`) => `A`

A pure function from environment to value.

## Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `A`, `never`\>

## Remarks

`asks(f)` is equivalent to `(r) => ok(f(r))`. The argument's parameter type
fixes the `R` channel for the rest of the pipeline; downstream operators
intersect any further requirements.

Use this when a step depends on something in the environment (a config
value, a service handle, the current time). For just reading the entire
environment unchanged, see [ask](ask.md).

## Example

```ts
import { asks } from '@konker.dev/neverthrow-r/constructors';

type Config = { multiplier: number };

const multiplier = asks((r: Config) => r.multiplier);
multiplier({ multiplier: 10 }); // Ok(10)
```

## See

[ask](ask.md)
