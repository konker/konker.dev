[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [provide](../README.md) / provideSome

# Function: provideSome()

## Call Signature

> **provideSome**\<`R`, `T`, `E`, `P`\>(`rr`, `partial`): [`ResultR`](../../types/type-aliases/ResultR.md)\<\{ \[K in string \| number \| symbol\]: Omit\<R, keyof P\>\[K\] \}, `T`, `E`\>

Defined in: [provide.ts:123](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/provide.ts#L123)

Supplies a *subset* of the requirements, returning a new `ResultR` whose
`R` is narrowed to the remaining keys.

### Type Parameters

#### R

`R`

The full requirements of `rr`.

#### T

`T`

The success type.

#### E

`E`

The error type.

#### P

`P` *extends* `Partial`\<`R`\>

The subset of `R` being supplied.

### Parameters

#### rr

[`ResultR`](../../types/type-aliases/ResultR.md)\<`R`, `T`, `E`\>

The `ResultR` or `ResultAsyncR` to partially provide for.

#### partial

`P`

The subset of requirements to inject now.

### Returns

[`ResultR`](../../types/type-aliases/ResultR.md)\<\{ \[K in string \| number \| symbol\]: Omit\<R, keyof P\>\[K\] \}, `T`, `E`\>

### Remarks

Useful for satisfying part of an environment at one level of an
application (e.g. injecting a config singleton in `main`) while leaving the
rest to be supplied later (e.g. a per-request handle).

The merge is shallow: `partial` and the runtime `rest` are spread into a
single object, with `partial` taking precedence on conflicting keys. There
is no deep merge — if a requirement value is a nested object, supply the
whole nested object in one call, not in pieces across two `provideSome`s.

The return type uses [Simplify](../../types/type-aliases/Simplify.md) to flatten `Omit<R, keyof P>` for a
clean inferred display.

### Example

```ts
import { asks } from '@konker.dev/neverthrow-r/constructors';
import { provide, provideSome } from '@konker.dev/neverthrow-r/provide';

type Deps = { config: { name: string }; handle: number };

const program = asks((r: Deps) => `${r.config.name}#${r.handle}`);

// Pre-inject config; defer handle to later.
const withConfig = provideSome(program, { config: { name: 'svc' } });

provide(withConfig, { handle: 42 }); // Ok('svc#42')
```

### See

[provide](provide.md)

## Call Signature

> **provideSome**\<`R`, `T`, `E`, `P`\>(`rr`, `partial`): [`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<\{ \[K in string \| number \| symbol\]: Omit\<R, keyof P\>\[K\] \}, `T`, `E`\>

Defined in: [provide.ts:127](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/provide.ts#L127)

Supplies a *subset* of the requirements, returning a new `ResultR` whose
`R` is narrowed to the remaining keys.

### Type Parameters

#### R

`R`

The full requirements of `rr`.

#### T

`T`

The success type.

#### E

`E`

The error type.

#### P

`P` *extends* `Partial`\<`R`\>

The subset of `R` being supplied.

### Parameters

#### rr

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<`R`, `T`, `E`\>

The `ResultR` or `ResultAsyncR` to partially provide for.

#### partial

`P`

The subset of requirements to inject now.

### Returns

[`ResultAsyncR`](../../types/type-aliases/ResultAsyncR.md)\<\{ \[K in string \| number \| symbol\]: Omit\<R, keyof P\>\[K\] \}, `T`, `E`\>

### Remarks

Useful for satisfying part of an environment at one level of an
application (e.g. injecting a config singleton in `main`) while leaving the
rest to be supplied later (e.g. a per-request handle).

The merge is shallow: `partial` and the runtime `rest` are spread into a
single object, with `partial` taking precedence on conflicting keys. There
is no deep merge — if a requirement value is a nested object, supply the
whole nested object in one call, not in pieces across two `provideSome`s.

The return type uses [Simplify](../../types/type-aliases/Simplify.md) to flatten `Omit<R, keyof P>` for a
clean inferred display.

### Example

```ts
import { asks } from '@konker.dev/neverthrow-r/constructors';
import { provide, provideSome } from '@konker.dev/neverthrow-r/provide';

type Deps = { config: { name: string }; handle: number };

const program = asks((r: Deps) => `${r.config.name}#${r.handle}`);

// Pre-inject config; defer handle to later.
const withConfig = provideSome(program, { config: { name: 'svc' } });

provide(withConfig, { handle: 42 }); // Ok('svc#42')
```

### See

[provide](provide.md)
