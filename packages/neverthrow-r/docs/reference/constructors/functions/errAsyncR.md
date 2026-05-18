[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [constructors](../README.md) / errAsyncR

# Function: errAsyncR()

> **errAsyncR**\<`E`, `T`\>(`error`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`unknown`, `T`, `E`\>

Defined in: [constructors.ts:133](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/constructors.ts#L133)

Async sibling of [errR](errR.md): lifts a plain error value into a
`ResultAsyncR` with no requirements.

## Type Parameters

### E

`E`

### T

`T` = `never`

## Parameters

### error

`E`

## Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`unknown`, `T`, `E`\>

## Example

```ts
import { errAsyncR } from '@konker.dev/neverthrow-r/constructors';

const fail = errAsyncR<string>('boom');
fail(undefined); // ResultAsync resolving to Err('boom')
```

## See

[errR](errR.md)
