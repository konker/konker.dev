[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [types](../README.md) / ExtendedScope

# Type Alias: ExtendedScope\<S, N, A\>

> **ExtendedScope**\<`S`, `N`, `A`\> = `S` *extends* `unknown` ? \{ \[K in keyof S \| N\]: K extends N ? A : K extends keyof S ? S\[K\] : never \} : `never`

Defined in: [types.ts:172](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/types.ts#L172)

Adds a typed field `N: A` to an existing scope `S`, preserving the existing
fields' types. Distributive over unions in `S`.

## Type Parameters

### S

`S` *extends* `object`

The existing scope record.

### N

`N` *extends* `string`

The string-literal name of the field being added.

### A

`A`

The type of the newly bound value.

## Remarks

This is the type-level operation behind bindR: it computes the
record shape *after* a new field has been bound, with the new field's type
`A` slotted in and existing fields untouched.

## Example

```ts
import type { ExtendedScope } from '@konker.dev/neverthrow-r/types';

type S0 = { user: { id: number } };
type S1 = ExtendedScope<S0, 'role', 'admin' | 'guest'>;
// { user: { id: number }; role: 'admin' | 'guest' }
```

## See

bindR
