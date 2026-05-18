[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [types](../README.md) / Simplify

# Type Alias: Simplify\<T\>

> **Simplify**\<`T`\> = `{ [K in keyof T]: T[K] }` & `object`

Defined in: [types.ts:127](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/types.ts#L127)

Flattens an intersection type into a single record so it renders nicely in
inferred type displays and tooltips.

## Type Parameters

### T

`T`

The type to flatten.

## Remarks

Used internally where a chain has accumulated `R1 & R2 & R3 & …` and a
cleaner display is desired (e.g. provideSome's return type). Has no
runtime effect.

## Example

```ts
import type { Simplify } from '@konker.dev/neverthrow-r/types';

type A = { a: number };
type B = { b: string };
type Combined = Simplify<A & B>; // { a: number; b: string }
```
