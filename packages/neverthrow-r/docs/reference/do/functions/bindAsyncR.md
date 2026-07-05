[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [do](../README.md) / bindAsyncR

# Function: bindAsyncR()

> **bindAsyncR**\<`N`, `S`, `R2`, `A`, `E2`\>(`name`, `f`): \<`R1`, `E1`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

Defined in: [do.ts:154](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/do.ts#L154)

Async sibling of [bindR](bindR.md): adds a named field to an async do-chain's
scope.

## Type Parameters

### N

`N` *extends* `string`

### S

`S` *extends* `object`

### R2

`R2`

### A

`A`

### E2

`E2`

## Parameters

### name

`N`

### f

(`s`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R2`, `A`, `E2`\>

## Returns

\<`R1`, `E1`\>(`rr`) => [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

## Example

```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { bindAsyncR, doAsyncR } from '@konker.dev/neverthrow-r/do';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(
  doAsyncR(),
  bindAsyncR('a', () => okAsyncR<number>(2)),
  bindAsyncR('b', ({ a }) => okAsyncR<number>(a * 10)),
);

program(undefined); // ResultAsync resolving to Ok({ a: 2, b: 20 })
```

## See

[bindR](bindR.md)
