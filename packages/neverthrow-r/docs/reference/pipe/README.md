[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../modules.md) / pipe

# pipe

Left-to-right function composition. Bundled so `neverthrow-r` doesn't drag
in a heavier fp library purely for `pipe`; signature is shape-compatible
with the `pipe` used by `effect`, `fp-ts`, `remeda`, and similar.

## Remarks

Every combinator in this package is curried so the operand `ResultR`
arrives last, making `pipe` the natural composition tool: feed the seed
value first, then list the operators in order.

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

- [pipe](functions/pipe.md)
