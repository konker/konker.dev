[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [types](../README.md) / Scope

# Type Alias: Scope\<Keys\>

> **Scope**\<`Keys`\> = `Record`\<`Keys`, `unknown`\>

Defined in: [types.ts:146](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/types.ts#L146)

A record-shaped scope keyed by string field names, used by do-notation to
accumulate intermediate values across a chain of `bindR` / `bindAsyncR`
steps.

## Type Parameters

### Keys

`Keys` *extends* `string`

The union of string keys currently in the scope.

## Example

```ts
import type { Scope } from '@konker.dev/neverthrow-r/types';

type S = Scope<'user' | 'config'>;
// { user: unknown; config: unknown }
```

## See

[ExtendedScope](ExtendedScope.md) for the type-level "add a field" operation.
