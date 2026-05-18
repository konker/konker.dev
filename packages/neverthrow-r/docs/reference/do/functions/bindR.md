[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [do](../README.md) / bindR

# Function: bindR()

> **bindR**\<`N`, `S`, `R2`, `A`, `E2`\>(`name`, `f`): \<`R1`, `E1`\>(`rr`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

Defined in: [do.ts:127](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/do.ts#L127)

Adds a named field to a do-chain's scope.

## Type Parameters

### N

`N` *extends* `string`

The string-literal name of the field being added.

### S

`S` *extends* `object`

The current scope record.

### R2

`R2`

The step's requirements.

### A

`A`

The value being bound.

### E2

`E2`

The step's error type.

## Parameters

### name

`N`

The field name to bind under.

### f

(`s`) => [`ResultR`](../../types/type-aliases/ResultR.md)\<`R2`, `A`, `E2`\>

Function from current scope to the next step's `ResultR`.

## Returns

> \<`R1`, `E1`\>(`rr`): [`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

### Type Parameters

#### R1

`R1`

#### E1

`E1`

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1`, `S`, `E1`\>

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R1` & `R2`, [`ExtendedScope`](../../types/type-aliases/ExtendedScope.md)\<`S`, `N`, `A`\>, `E2` \| `E1`\>

## Remarks

`bindR('name', f)` runs `f(scope)` and, on success, attaches its value at
key `name` in the scope record. The step's requirements `R2` are
intersected (`R1 & R2`) and its error type `E2` is unioned (`E1 | E2`).

The callback receives the *current* scope, so later binds can depend on
earlier ones — a key ergonomic win over a flat sequence of andThen.

## Example

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { bindR, doR } from '@konker.dev/neverthrow-r/do';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(
  doR(),
  bindR('a', () => okR<number>(2)),
  bindR('b', ({ a }) => okR<number>(a * 10)),
);

program(undefined); // Ok({ a: 2, b: 20 })
```

## See

 - [bindAsyncR](bindAsyncR.md)
 - [ExtendedScope](../../types/type-aliases/ExtendedScope.md)
