[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../modules.md) / constructors

# constructors

Entry points for building `ResultR` / `ResultAsyncR` values from scratch or
from existing `neverthrow` values. Use these where a pipeline starts.

## Remarks

- [okR](functions/okR.md) / [errR](functions/errR.md) / [okAsyncR](functions/okAsyncR.md) / [errAsyncR](functions/errAsyncR.md) — lift a
  plain value (or error) into a `ResultR` / `ResultAsyncR` with no
  requirements (`R = unknown`).
- [fromResult](functions/fromResult.md) / [fromResultAsync](functions/fromResultAsync.md) — lift an existing neverthrow
  `Result` / `ResultAsync` into the `R`-channel layer with no requirements.
- [asks](functions/asks.md) / [ask](functions/ask.md) — build a `ResultR` whose only effect is to
  read from the environment, declaring `R` in the process.

Any non-trivial requirements (a database handle, a clock, …) are introduced
with `asks`; the rest of the pipeline picks them up via intersection in
`andThen`-style operators.

## Example

```ts
import { asks, okR } from '@konker.dev/neverthrow-r/constructors';
import { andThen, map } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

type Clock = { now: () => Date };

const year = asks((r: Clock) => r.now().getFullYear());

const program = pipe(
  okR<number>(2024),
  map((n) => n + 1),
  andThen(() => year),
);
```

## Functions

- [ask](functions/ask.md)
- [asks](functions/asks.md)
- [errAsyncR](functions/errAsyncR.md)
- [errR](functions/errR.md)
- [fromResult](functions/fromResult.md)
- [fromResultAsync](functions/fromResultAsync.md)
- [okAsyncR](functions/okAsyncR.md)
- [okR](functions/okR.md)
