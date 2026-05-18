[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../modules.md) / do

# do

Do-notation for `ResultR` / `ResultAsyncR`: chain steps that each bind a
value into a named scope, with the scope record carried through the chain
as the success type.

## Remarks

Two pairs of helpers:

- [doR](functions/doR.md) / [doAsyncR](functions/doAsyncR.md) — seed a chain with an empty scope `{}`.
- [bindR](functions/bindR.md) / [bindAsyncR](functions/bindAsyncR.md) — add a named field by running a step
  that depends on the current scope, then attaching its result under a key.

Use this in place of nested andThen when several intermediate
values are needed downstream. Requirements `R` intersect across steps; the
error channel unions; the success record grows with each `bind*`.

## Example

```ts
import { asks, okR } from '@konker.dev/neverthrow-r/constructors';
import { bindR, doR } from '@konker.dev/neverthrow-r/do';
import { map } from '@konker.dev/neverthrow-r/sync';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

type Config = { greeting: string };

const program = pipe(
  doR(),
  bindR('name', () => okR<string>('world')),
  bindR('greeting', () => asks((r: Config) => r.greeting)),
  map(({ greeting, name }) => `${greeting}, ${name}!`),
);

program({ greeting: 'hello' }); // Ok('hello, world!')
```

## Functions

- [bindAsyncR](functions/bindAsyncR.md)
- [bindR](functions/bindR.md)
- [doAsyncR](functions/doAsyncR.md)
- [doR](functions/doR.md)
