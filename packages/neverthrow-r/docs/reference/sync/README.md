[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../modules.md) / sync

# sync

Sync combinators over `ResultR`. This is the canonical surface — the async
module (mapAsync, andThenAsync, …) mirrors it 1:1 over
`ResultAsyncR`.

## Remarks

Every combinator is curried so it composes cleanly under [pipe](../pipe/README.md): the
transforming function comes first, then the operand `ResultR`. Each one
delegates to the corresponding neverthrow `Result` method, threading the
environment `r` through and **intersecting** requirements across composed
steps (`R1 & R2`).

Reach for this module when the whole chain is synchronous. The moment a
step needs to await, switch into [bridges](../bridges/README.md) (sync→async one-shot) or
the [async](../async/README.md) module (already-async chain).

## Example

```ts
import { okR } from '@konker.dev/neverthrow-r/constructors';
import { andThen, map } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const program = pipe(
  okR<number>(2),
  map((n) => n + 1),
  andThen((n) => okR<string>(`got ${n}`)),
);

program(undefined); // Ok('got 3')
```

## Functions

- [andTee](functions/andTee.md)
- [andThen](functions/andThen.md)
- [andThrough](functions/andThrough.md)
- [map](functions/map.md)
- [mapErr](functions/mapErr.md)
- [match](functions/match.md)
- [orElse](functions/orElse.md)
- [orTee](functions/orTee.md)
