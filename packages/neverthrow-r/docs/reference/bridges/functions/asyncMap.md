[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [bridges](../README.md) / asyncMap

# Function: asyncMap()

> **asyncMap**\<`A`, `B`\>(`f`): \<`R`, `E`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

Defined in: [bridges.ts:66](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/bridges.ts#L66)

Promotes a `ResultR` to a `ResultAsyncR` by applying a `Promise`-returning
transform to the success value.

## Type Parameters

### A

`A`

The input success type.

### B

`B`

The output success type.

## Parameters

### f

(`a`) => `Promise`\<`B`\>

`Promise`-returning transform from `A` to `B`.

## Returns

> \<`R`, `E`\>(`rr`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

### Type Parameters

#### R

`R`

#### E

`E`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `A`, `E`\>

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `B`, `E`\>

## Remarks

The sync→async sibling of map. After this step the chain is async;
follow with mapAsync, andThenAsync, etc.

## Example

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { asyncMap } from '@konker.dev/neverthrow-r/bridges';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(okR<number>(2), asyncMap(async (n) => n * 2));
program(undefined); // ResultAsync resolving to Ok(4)
```

## See

 - map
 - mapAsync
