[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [constructors](../README.md) / fromResult

# Function: fromResult()

> **fromResult**\<`T`, `E`\>(`r`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`unknown`, `T`, `E`\>

Defined in: [constructors.ts:163](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/constructors.ts#L163)

Lifts an existing neverthrow `Result<T, E>` into a `ResultR<unknown, T, E>`.

## Type Parameters

### T

`T`

The success type.

### E

`E`

The error type.

## Parameters

### r

`Result`\<`T`, `E`\>

The existing `Result` to lift.

## Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`unknown`, `T`, `E`\>

## Remarks

Useful at the seam where existing neverthrow-using code is being adapted
into a pipeline that wants the `R` channel — wrap the legacy value once and
compose normally thereafter.

## Example

```ts
import { ok } from 'neverthrow';
import { fromResult } from '@konker.dev/neverthrow-r/constructors';

const existing = ok<number, string>(42);
const lifted = fromResult(existing);
lifted(undefined); // Ok(42)
```

## See

[fromResultAsync](fromResultAsync.md)
