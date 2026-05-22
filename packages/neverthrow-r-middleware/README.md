# @konker.dev/neverthrow-r-middleware

Type-safe HTTP middleware system built on
[`@konker.dev/neverthrow-r`](../neverthrow-r). Composition is decorator-style:
each middleware wraps an inner handler and returns a new handler.

```ts
import type { ResultAsyncR } from '@konker.dev/neverthrow-r/types';

export type Handler<I, R, O, E> = (i: I) => ResultAsyncR<R, O, E>;
```

The package is the `ResultAsyncR`-based counterpart to
[`@konker.dev/middleware-fp`](../middleware-fp) (which is built on Effect).

## Included middlewares

- `identity` / `trivial` — minimal decorator examples.
- `jsonBodyParserRequest` / `jsonBodySerializerResponse` — JSON request/response IO.
- `bodyValidator` — validates the request body against any
  [Standard Schema](https://standardschema.dev) validator (zod, valibot,
  arktype, effect/Schema, …).
- `requestResponseLogger` — logs request/response via the `Logger` threaded
  through the `R` channel.
- `apiGatewayProxyEventV2Adapter` — adapts an AWS API Gateway HTTP API event.
- `honoAdapter` — adapts a `HonoRequest`.
