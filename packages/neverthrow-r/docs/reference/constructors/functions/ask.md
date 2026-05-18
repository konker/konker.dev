[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [constructors](../README.md) / ask

# Function: ask()

> **ask**\<`R`\>(): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `R`, `never`\>

Defined in: [constructors.ts:245](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/constructors.ts#L245)

Reads the entire environment as the success value.

## Type Parameters

### R

`R`

The requirements (environment), surfaced as the success type.

## Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `R`, `never`\>

## Remarks

Specialisation of [asks](asks.md) with the identity function. Most useful when
a step wants the whole environment passed downstream — e.g. to forward it
into a sub-pipeline.

## Example

```ts
import { ask } from '@konker.dev/neverthrow-r/constructors';

type Config = { multiplier: number };

const env = ask<Config>();
env({ multiplier: 10 }); // Ok({ multiplier: 10 })
```

## See

[asks](asks.md)
