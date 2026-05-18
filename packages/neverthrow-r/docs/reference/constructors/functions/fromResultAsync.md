[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [constructors](../README.md) / fromResultAsync

# Function: fromResultAsync()

> **fromResultAsync**\<`T`, `E`\>(`ra`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`unknown`, `T`, `E`\>

Defined in: [constructors.ts:184](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/constructors.ts#L184)

Async sibling of [fromResult](fromResult.md): lifts an existing `ResultAsync<T, E>`
into a `ResultAsyncR<unknown, T, E>`.

## Type Parameters

### T

`T`

### E

`E`

## Parameters

### ra

`ResultAsync`\<`T`, `E`\>

## Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`unknown`, `T`, `E`\>

## Example

```ts
import { okAsync } from 'neverthrow';
import { fromResultAsync } from '@konker.dev/neverthrow-r/constructors';

const existing = okAsync<number, string>(42);
const lifted = fromResultAsync(existing);
lifted(undefined); // ResultAsync resolving to Ok(42)
```

## See

[fromResult](fromResult.md)
