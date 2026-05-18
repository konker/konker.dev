[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [constructors](../README.md) / errR

# Function: errR()

> **errR**\<`E`, `T`\>(`error`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`unknown`, `T`, `E`\>

Defined in: [constructors.ts:95](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/constructors.ts#L95)

Lifts a plain error value into a `ResultR` with no requirements.

## Type Parameters

### E

`E`

The error type.

### T

`T` = `never`

The success type (defaults to `never` since this always
  fails).

## Parameters

### error

`E`

The error value to wrap in an `Err`.

## Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`unknown`, `T`, `E`\>

## Example

```ts
import { errR } from '@konker.dev/neverthrow-r/constructors';

const fail = errR<string>('boom');
fail(undefined); // Err('boom')
```

## See

 - [okR](okR.md)
 - [errAsyncR](errAsyncR.md)
