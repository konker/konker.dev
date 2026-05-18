[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [sync](../README.md) / mapErr

# Function: mapErr()

> **mapErr**\<`E`, `F`\>(`f`): \<`R`, `T`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `F`\>

Defined in: [sync.ts:106](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/sync.ts#L106)

Transforms the error value of a `ResultR` with a pure function.

## Type Parameters

### E

`E`

The input error type.

### F

`F`

The output error type.

## Parameters

### f

(`e`) => `F`

Pure transformation from `E` to `F`.

## Returns

> \<`R`, `T`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `F`\>

### Type Parameters

#### R

`R`

#### T

`T`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `F`\>

## Remarks

Symmetric to [map](map.md), but operates on the `E` channel. `T` and `R` pass
through unchanged. Useful for narrowing a wide error type to a domain-
specific one, or for annotating where in a pipeline an error occurred.

## Example

```ts
import { errR } from '@konker.dev/neverthrow-r/constructors';
import { mapErr } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const annotated = pipe(
  errR<string>('not found'),
  mapErr((msg) => ({ tag: 'lookup', message: msg })),
);

annotated(undefined); // Err({ tag: 'lookup', message: 'not found' })
```

## See

 - [map](map.md)
 - mapErrAsync
