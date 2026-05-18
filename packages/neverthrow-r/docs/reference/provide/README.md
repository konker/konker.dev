[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../modules.md) / provide

# provide

Provision: supply the accumulated requirements `R` to a `ResultR` /
`ResultAsyncR` and exit back into a plain `neverthrow` `Result` /
`ResultAsync`.

## Remarks

The rest of the package builds up an `R` channel through intersection;
this module is where you discharge it. Two flavours:

- [provide](functions/provide.md) — supply the full environment in one call. Returns the
  underlying `Result` (or `ResultAsync`).
- [provideSome](functions/provideSome.md) — supply a *subset* of the requirements. Returns a
  new `ResultR` over the keys that remain unsatisfied.

## Example

```ts
import { asks } from '@konker.dev/neverthrow-r/constructors';
import { provide } from '@konker.dev/neverthrow-r/provide';

type Deps = { factor: number };

const program = asks((r: Deps) => r.factor * 2);

provide(program, { factor: 10 }); // Ok(20)
```

## Functions

- [provide](functions/provide.md)
- [provideSome](functions/provideSome.md)
