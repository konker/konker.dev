[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [do](../README.md) / doAsyncR

# Function: doAsyncR()

> **doAsyncR**\<`R`\>(): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `Record`\<`never`, `never`\>, `never`\>

Defined in: [do.ts:84](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/do.ts#L84)

Async sibling of [doR](doR.md): seeds a do-chain with an empty scope over a
`ResultAsyncR`.

## Type Parameters

### R

`R` = `unknown`

## Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `Record`\<`never`, `never`\>, `never`\>

## Example

```ts
import { doAsyncR } from '@konker.dev/neverthrow-r/do';

const start = doAsyncR();
start(undefined); // ResultAsync resolving to Ok({})
```

## See

[doR](doR.md)
