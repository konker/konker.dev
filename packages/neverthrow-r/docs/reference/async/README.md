[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../modules.md) / async

# async

Async combinators over `ResultAsyncR`, mirroring the sync surface from
[sync](../sync/README.md) 1:1. Each combinator is the `Async`-suffixed sibling of its
sync counterpart; semantics and type signatures match, lifted to
`ResultAsyncR`.

## Remarks

Cross-link to the sync module for the full prose on each combinator. The
docs here focus on the async-specific shape: each transformer accepts
`Promise`-returning functions, and the operand is a `ResultAsyncR`.

Reach for this module when the chain is already async (e.g. it started
with okAsyncR or was promoted via [bridges](../bridges/README.md)). To enter the
async track from a sync chain mid-pipeline, use [bridges](../bridges/README.md) instead.

## Example

```ts
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(
  okAsyncR<number>(2),
  mapAsync(async (n) => n + 1),
  andThenAsync((n) => okAsyncR<string>(`got ${n}`)),
);

program(undefined); // ResultAsync resolving to Ok('got 3')
```

## Functions

- [andTeeAsync](functions/andTeeAsync.md)
- [andThenAsync](functions/andThenAsync.md)
- [andThroughAsync](functions/andThroughAsync.md)
- [mapAsync](functions/mapAsync.md)
- [mapErrAsync](functions/mapErrAsync.md)
- [matchAsync](functions/matchAsync.md)
- [orElseAsync](functions/orElseAsync.md)
- [orTeeAsync](functions/orTeeAsync.md)
