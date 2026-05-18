[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [do](../README.md) / doR

# Function: doR()

> **doR**\<`R`\>(): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `Record`\<`never`, `never`\>, `never`\>

Defined in: [do.ts:65](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/do.ts#L65)

Seeds a do-chain with an empty scope record `{}` over a `ResultR`.

## Type Parameters

### R

`R` = `unknown`

The chain's requirements (defaults to `unknown`).

## Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `Record`\<`never`, `never`\>, `never`\>

## Remarks

Pass an explicit type argument when you want to fix the chain's
requirements up front; otherwise leave it as `unknown` and let downstream
[bindR](bindR.md) calls accumulate requirements via intersection.

## Example

```ts
import { doR } from '@konker.dev/neverthrow-r/do';

const start = doR();
start(undefined); // Ok({})
```

## See

 - [doAsyncR](doAsyncR.md)
 - [bindR](bindR.md)
