[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [sync](../README.md) / orTee

# Function: orTee()

> **orTee**\<`E`\>(`f`): \<`R`, `T`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

Defined in: [sync.ts:311](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L311)

Runs a side effect with the error value, propagating the error unchanged.

## Type Parameters

### E

`E`

The error type (preserved through the step).

## Parameters

### f

(`e`) => `unknown`

Side-effecting callback receiving the error value.

## Returns

> \<`R`, `T`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

### Type Parameters

#### R

`R`

#### T

`T`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

## Remarks

Error-channel mirror of [andTee](andTee.md). Useful for logging failures without
altering the error type or recovering from it.

## Example

```ts
import { errR } from '@konker.dev/neverthrow-r/constructors';
import { orTee } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const logged = pipe(
  errR<string>('boom'),
  orTee((e) => console.error('failed:', e)),
);

logged(undefined); // logs 'failed: boom', returns Err('boom')
```

## See

 - [andTee](andTee.md)
 - orTeeAsync
