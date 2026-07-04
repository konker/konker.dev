[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [async](../README.md) / matchAsync

# Function: matchAsync()

> **matchAsync**\<`T`, `E`, `A`, `B`\>(`okFn`, `errFn`): \<`R`\>(`rr`) => (`r`) => `Promise`\<`A` \| `B`\>

Defined in: [async.ts:151](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/async.ts#L151)

Async variant of match. Returns a function from environment to a
`Promise` of the matched value.

## Type Parameters

### T

`T`

### E

`E`

### A

`A`

### B

`B` = `A`

## Parameters

### okFn

(`t`) => `A`

### errFn

(`e`) => `B`

## Returns

\<`R`\>(`rr`) => (`r`) => `Promise`\<`A` \| `B`\>

## Example

```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { matchAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const rendered = pipe(
  okAsyncR<number>(42),
  matchAsync(
    (n) => `got ${n}`,
    (e: never) => `error: ${String(e)}`,
  ),
);
// rendered(undefined) is Promise<string>
```

## See

match
