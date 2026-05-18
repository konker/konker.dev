/**
 * Public barrel for `@konker.dev/neverthrow-r` — a thin Reader-function layer
 * over `neverthrow` that adds a third *requirements* channel `R` alongside
 * the usual `T` / `E` of `Result`.
 *
 * @remarks
 * Re-exports every public type, constructor, operator, bridge, do-notation
 * helper, provision function, and `pipe`. For a guided tour and "pick your
 * module" table, see the package landing page; for the conceptual model of
 * the `R` channel, see {@link types}.
 *
 * @example
 * ```ts
 * import {
 *   andThen,
 *   map,
 *   okR,
 *   pipe,
 *   provide,
 * } from '@konker.dev/neverthrow-r';
 *
 * const program = pipe(
 *   okR<number>(2),
 *   map((n) => n + 1),
 *   andThen((n) => okR<string>(`got ${n}`)),
 * );
 *
 * provide(program, undefined); // Ok('got 3')
 * ```
 *
 * @module
 */

export type { ExtendedScope, ResultAsyncR, ResultR, Scope, Simplify } from './types.js';

export { ask, asks, errAsyncR, errR, fromResult, fromResultAsync, okAsyncR, okR } from './constructors.js';

export { andTee, andThen, andThrough, map, mapErr, match, orElse, orTee } from './sync.js';

export {
  andTeeAsync,
  andThenAsync,
  andThroughAsync,
  mapAsync,
  mapErrAsync,
  matchAsync,
  orElseAsync,
  orTeeAsync,
} from './async.js';

export { asyncAndThen, asyncAndThrough, asyncMap } from './bridges.js';

export { provide, provideSome } from './provide.js';

export { bindAsyncR, bindR, doAsyncR, doR } from './do.js';

export { pipe } from './pipe.js';
