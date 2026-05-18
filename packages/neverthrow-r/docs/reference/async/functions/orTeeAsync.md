[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [async](../README.md) / orTeeAsync

# Function: orTeeAsync()

> **orTeeAsync**\<`E`\>(`f`): \<`R`, `T`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

Defined in: [async.ts:191](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L191)

Async variant of orTee.

## Type Parameters

### E

`E`

## Parameters

### f

(`e`) => `unknown`

## Returns

> \<`R`, `T`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

### Type Parameters

#### R

`R`

#### T

`T`

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

## Example

```ts
import { errAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { orTeeAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const logged = pipe(errAsyncR<string>('boom'), orTeeAsync((e) => console.error(e)));
```

## See

orTee
