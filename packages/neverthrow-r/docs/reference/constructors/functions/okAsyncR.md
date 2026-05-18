[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [constructors](../README.md) / okAsyncR

# Function: okAsyncR()

> **okAsyncR**\<`T`, `E`\>(`value`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`unknown`, `T`, `E`\>

Defined in: [constructors.ts:114](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/constructors.ts#L114)

Async sibling of [okR](okR.md): lifts a plain success value into a
`ResultAsyncR` with no requirements.

## Type Parameters

### T

`T`

### E

`E` = `never`

## Parameters

### value

`T`

## Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`unknown`, `T`, `E`\>

## Example

```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';

const program = okAsyncR<number>(2);
program(undefined); // ResultAsync resolving to Ok(2)
```

## See

[okR](okR.md)
