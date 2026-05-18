[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../modules.md) / bridges

# bridges

Sync→async bridge operators: take a `ResultR` and return a `ResultAsyncR`,
promoting the chain onto the async track mid-pipeline.

## Remarks

Reach for this module when a chain that starts synchronously needs to
await — typically an I/O call partway through. Three flavours, mirroring
the corresponding sync combinators but lifting the operand into
`ResultAsyncR`:

- [asyncMap](functions/asyncMap.md) — promote via a `Promise`-returning transform.
- [asyncAndThen](functions/asyncAndThen.md) — promote via a `ResultAsyncR`-returning step.
- [asyncAndThrough](functions/asyncAndThrough.md) — promote via a fallible async tee.

Every step *after* the bridge must come from [async](../async/README.md) (the
`*Async`-suffixed combinators); there is no async→sync bridge.

## Example

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { mapAsync } from '@konker.dev/neverthrow-r/async';
import { asyncMap } from '@konker.dev/neverthrow-r/bridges';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(
  okR<number>(2),
  asyncMap(async (n) => n + 1),   // sync → async here
  mapAsync(async (n) => n * 10),  // continue async
);

program(undefined); // ResultAsync resolving to Ok(30)
```

## Functions

- [asyncAndThen](functions/asyncAndThen.md)
- [asyncAndThrough](functions/asyncAndThrough.md)
- [asyncMap](functions/asyncMap.md)
